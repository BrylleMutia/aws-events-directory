interface Props {
  letters: string[]
  onJump: (letter: string) => void
}

export function LetterBar({ letters, onJump }: Props) {
  if (letters.length === 0) return null
  return (
    <nav aria-label="Jump to letter" className="no-scrollbar -mx-4 flex gap-0.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {letters.map((letter) => (
        <button
          key={letter}
          type="button"
          onClick={() => onJump(letter)}
          className="h-7 w-7 shrink-0 rounded-md font-mono text-xs text-muted transition-colors hover:bg-accent-tint hover:text-accent-ink-strong"
        >
          {letter}
        </button>
      ))}
    </nav>
  )
}
