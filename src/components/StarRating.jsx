import { Star } from 'lucide-react'

export default function StarRating({ value, onChange, readonly = false, size = 24 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
