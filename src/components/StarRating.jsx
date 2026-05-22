export default function StarRating({ value, onChange, readonly = false, size = 24 }) {
  const stars = [1, 2, 3, 4, 5]

  const handleClick = (e, star) => {
    if (readonly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const half = e.clientX < rect.left + rect.width / 2
    onChange(half ? star - 0.5 : star)
  }

  const handleMouseMove = () => {} // handled via CSS

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => {
        const full = value >= star
        const half = !full && value >= star - 0.5

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={(e) => handleClick(e, star)}
            className={`relative transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
            style={{ width: size, height: size }}
          >
            {/* Background star (empty) */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className="absolute inset-0 text-gray-300"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Filled star (full or half) */}
            {(full || half) && (
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                className="absolute inset-0 text-amber-400"
                fill="currentColor"
                style={half ? { clipPath: 'inset(0 50% 0 0)' } : {}}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
