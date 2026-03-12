'use client';

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

const EMOJI_OPTIONS = [
  '✅', '💪', '📚', '🧘', '🏃', '💧', '🎯', '✍️',
  '🌅', '💤', '🥗', '🧠', '🎵', '🏋️', '📝', '🌿',
  '❤️', '⭐', '🔥', '🎨', '💻', '🧹', '📖', '🏊',
];

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
            selected === emoji
              ? 'bg-accent/25 ring-1 ring-accent scale-110'
              : 'bg-white/[0.06] hover:bg-white/[0.12]'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
