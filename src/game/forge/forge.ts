import type { DieFaces, DieInstance, FaceInstance } from "../types/dice";
import type { PendingWorkshopForge, WorkshopDieFace } from "../types/workshop";

export interface ForgeResult {
  amount: number;
  rolledAmount: number;
  dieId: string;
  faceId: string;
  workshopFaceId: string | null;
  cost: number;
  newValue: number;
  previousValue: number;
  isJackpot: boolean;
}
export const BASE_CHAOS_FORGE_COST = 1;

export function canForgeFace(face: FaceInstance): boolean {
  if (face.imprint) return true;
  return true;
}

export function getDieUpgradeCount(die: DieInstance): number {
  return die.faces.reduce(
    (total, face) => total + Math.max(0, face.value - 1),
    0,
  );
}

export function getPrecisionForgeCost(
  face: FaceInstance,
  costMultiplier = 1,
): number | null {
  if (!canForgeFace(face)) return null;
  return Math.max(
    1,
    Math.ceil(BASE_CHAOS_FORGE_COST * 2 * Math.max(0, costMultiplier)),
  );
}

export function getChaosEligibleFaces(die: DieInstance): FaceInstance[] {
  return die.faces.filter((face) => canForgeFace(face));
}

export function getChaosForgeCost(
  die: DieInstance,
  costMultiplier = 1,
): number | null {
  const eligibleFaces = getChaosEligibleFaces(die);
  if (eligibleFaces.length === 0) return null;

  const upgradeTier = Math.floor(Math.max(0, getDieUpgradeCount(die) - 1) / 3);
  const baseCost = BASE_CHAOS_FORGE_COST + upgradeTier;
  return Math.max(1, Math.ceil(baseCost * Math.max(0, costMultiplier)));
}

export function forgeFaceOnDie(
  die: DieInstance,
  faceId: string,
  amount = 1,
): {
  die: DieInstance;
  newValue: number;
  previousValue: number;
} | null {
  const face = die.faces.find((candidate) => candidate.id === faceId);
  if (!face || !canForgeFace(face)) return null;
  const previousValue = face.value;
  const newValue = face.value + Math.max(1, Math.floor(amount));

  return {
    newValue,
    previousValue,
    die: {
      ...die,
      faces: die.faces.map((candidate) =>
        candidate.id === faceId
          ? {
              ...candidate,
              value: newValue,
            }
          : candidate,
      ) as DieFaces,
    },
  };
}

export function precisionForge(
  die: DieInstance,
  faceId: string,
  costMultiplier = 1,
): { die: DieInstance; result: ForgeResult } | null {
  const face = die.faces.find((candidate) => candidate.id === faceId);
  if (!face) return null;
  const cost = getPrecisionForgeCost(face, costMultiplier);
  const forged = forgeFaceOnDie(die, faceId, 1);
  if (cost === null || !forged) return null;
  return {
    die: forged.die,
    result: {
      amount: forged.newValue - forged.previousValue,
      rolledAmount: 1,
      dieId: die.id,
      faceId,
      workshopFaceId: null,
      cost,
      newValue: forged.newValue,
      previousValue: forged.previousValue,
      isJackpot: false,
    },
  };
}
function clampRandomRoll(random: () => number): number {
  return Math.min(0.999999999, Math.max(0, random()));
}

export function selectWorkshopTargetFace(
  die: DieInstance,
  roll: number,
): FaceInstance | null {
  const eligibleFaces = getChaosEligibleFaces(die);
  if (eligibleFaces.length === 0) return null;
  const imprintFaces = eligibleFaces.filter((face) => face.imprint);
  const regularFaces = eligibleFaces.filter((face) => !face.imprint);
  const boundedRoll = Math.min(0.999999999, Math.max(0, roll));

  // An attached Imprint owns its physical face slot: exactly one sixth per Imprint.
  // Any probability belonging to dormant non-forgeable base faces is redistributed
  // only among regular forgeable faces, never onto Imprints.
  const imprintBand = Math.min(1, imprintFaces.length / 6);
  if (imprintFaces.length > 0 && boundedRoll < imprintBand) {
    return imprintFaces[Math.floor(boundedRoll * 6)] ?? imprintFaces[0];
  }
  if (regularFaces.length === 0) return imprintFaces[0] ?? null;
  const normalizedRegularRoll =
    imprintBand >= 1 ? 0 : (boundedRoll - imprintBand) / (1 - imprintBand);
  return regularFaces[
    Math.min(
      regularFaces.length - 1,
      Math.floor(normalizedRegularRoll * regularFaces.length),
    )
  ];
}

export function prepareWorkshopForge(
  die: DieInstance,
  operationId: string,
  workshopFaces: readonly WorkshopDieFace[],
  random: () => number = Math.random,
  options: {
    costMultiplier?: number;
    targetRerolls?: number;
  } = {},
): PendingWorkshopForge | null {
  if (!operationId || workshopFaces.length === 0) return null;
  const eligibleFaces = getChaosEligibleFaces(die);
  const cost = getChaosForgeCost(die, options.costMultiplier);
  if (eligibleFaces.length === 0 || cost === null) return null;

  const faceRoll = clampRandomRoll(random);
  const targetFace = selectWorkshopTargetFace(die, faceRoll);
  if (!targetFace) return null;
  const workshopRoll = clampRandomRoll(random);
  const workshopFace =
    workshopFaces[Math.floor(workshopRoll * workshopFaces.length)];
  const rolledAmount = Math.max(1, Math.floor(workshopFace.value));

  return {
    operationId,
    dieId: die.id,
    targetFaceId: targetFace.id,
    targetFaceHistory: [targetFace.id],
    targetRerollOperationIds: [],
    rerollsRemaining: Math.max(0, Math.floor(options.targetRerolls ?? 0)),
    workshopFaceId: workshopFace.id,
    rolledAmount,
    appliedAmount: rolledAmount,
    previousValue: targetFace.value,
    cost,
  };
}

export function rerollWorkshopTarget(
  die: DieInstance,
  pending: PendingWorkshopForge,
  rerollOperationId: string,
  random: () => number = Math.random,
): PendingWorkshopForge | null {
  if (
    pending.dieId !== die.id ||
    !rerollOperationId ||
    pending.rerollsRemaining <= 0 ||
    pending.targetRerollOperationIds.includes(rerollOperationId)
  )
    return null;

  const currentTarget = die.faces.find(
    (face) => face.id === pending.targetFaceId,
  );
  const eligibleFaces = getChaosEligibleFaces(die);
  if (
    !currentTarget ||
    currentTarget.value !== pending.previousValue ||
    eligibleFaces.length === 0
  )
    return null;

  const faceRoll = clampRandomRoll(random);
  const targetFace = selectWorkshopTargetFace(die, faceRoll);
  if (!targetFace) return null;
  return {
    ...pending,
    targetFaceId: targetFace.id,
    targetFaceHistory: [...pending.targetFaceHistory, targetFace.id],
    targetRerollOperationIds: [
      ...pending.targetRerollOperationIds,
      rerollOperationId,
    ],
    rerollsRemaining: pending.rerollsRemaining - 1,
    previousValue: targetFace.value,
  };
}

export function completeWorkshopForge(
  die: DieInstance,
  pending: PendingWorkshopForge,
): { die: DieInstance; result: ForgeResult } | null {
  if (pending.dieId !== die.id) return null;
  const targetFace = die.faces.find((face) => face.id === pending.targetFaceId);
  if (
    !targetFace ||
    targetFace.value !== pending.previousValue ||
    !canForgeFace(targetFace)
  )
    return null;

  const appliedAmount = Math.max(1, Math.floor(pending.appliedAmount));
  const forged = forgeFaceOnDie(die, targetFace.id, appliedAmount);
  if (!forged) return null;

  return {
    die: forged.die,
    result: {
      amount: forged.newValue - forged.previousValue,
      rolledAmount: pending.rolledAmount,
      dieId: die.id,
      faceId: targetFace.id,
      workshopFaceId: pending.workshopFaceId,
      cost: pending.cost,
      newValue: forged.newValue,
      previousValue: forged.previousValue,
      isJackpot:
        pending.rolledAmount > 1 && forged.newValue - forged.previousValue > 1,
    },
  };
}
