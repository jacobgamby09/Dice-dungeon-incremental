import type { SignatureFaceId } from '../../game/types/dice'

interface SignatureIconProps {
  signatureId: SignatureFaceId
  size?: number
}

export function SignatureIcon({ signatureId, size = 18 }: SignatureIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`signature-icon signature-icon--${signatureId}`}
      data-signature-icon={signatureId}
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {signatureId === 'execute' ? (
        <>
          <path d="M4 20 20 4M12 4h8v8" />
          <path d="M5 7h5M5 7v5" />
        </>
      ) : (
        <>
          <path d="M4 20V8l8-5 8 5v12H4Z" />
          <path d="M8 20v-6h8v6M8 9h8" />
        </>
      )}
    </svg>
  )
}
