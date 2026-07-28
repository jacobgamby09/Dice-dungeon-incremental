import { useEffect, useRef, useState } from 'react'
import { DoorOpen, Pause, Swords } from 'lucide-react'

interface RunMenuProps {
  onClose: () => void
  onLeave: () => void
}

export function RunMenu({ onClose, onLeave }: RunMenuProps) {
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const resumeButtonRef = useRef<HTMLButtonElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (confirmingLeave) confirmButtonRef.current?.focus()
    else resumeButtonRef.current?.focus()
  }, [confirmingLeave])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirmingLeave) setConfirmingLeave(false)
      else onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmingLeave, onClose])

  return (
    <div
      className="run-menu-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="run-menu-title"
        aria-modal="true"
        className="run-menu"
        role="dialog"
      >
        <header>
          <Pause aria-hidden="true" size={18} />
          <div>
            <span>{confirmingLeave ? 'Confirm retreat' : 'Run paused'}</span>
            <h2 id="run-menu-title">
              {confirmingLeave ? 'Leave Dungeon?' : 'Dungeon Run'}
            </h2>
          </div>
        </header>

        {confirmingLeave ? (
          <>
            <p>
              Your XP and Souls are already secured. Current floor progress and HP
              will be lost.
            </p>
            <div className="run-menu__actions">
              <button
                className="pixel-button run-menu__keep-fighting"
                onClick={() => setConfirmingLeave(false)}
                type="button"
              >
                <Swords aria-hidden="true" size={17} />
                Keep Fighting
              </button>
              <button
                className="pixel-button run-menu__leave-confirm"
                onClick={onLeave}
                ref={confirmButtonRef}
                type="button"
              >
                <DoorOpen aria-hidden="true" size={17} />
                Confirm Leave
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Combat and Auto Combat are paused while this menu is open.
            </p>
            <div className="run-menu__actions">
              <button
                className="pixel-button pixel-button--primary"
                onClick={onClose}
                ref={resumeButtonRef}
                type="button"
              >
                <Swords aria-hidden="true" size={17} />
                Resume Run
              </button>
              <button
                className="pixel-button run-menu__leave"
                onClick={() => setConfirmingLeave(true)}
                type="button"
              >
                <DoorOpen aria-hidden="true" size={17} />
                Leave Dungeon
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
