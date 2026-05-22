import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

async function getCroppedBlob(imageSrc, croppedAreaPixels, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2)

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - croppedAreaPixels.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - croppedAreaPixels.y)
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
  })
}

export default function ImageCropModal({ imageSrc, aspect = 4 / 3, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation)
    const preview = URL.createObjectURL(blob)
    onConfirm(blob, preview)
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
        <button onClick={onCancel} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <X size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>
        <span className="text-white font-bold text-sm">Recadrer</span>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
        >
          <Check size={16} />
          Valider
        </button>
      </div>

      {/* Cropper */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: { border: '2px solid white' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/80 px-6 py-4 flex-shrink-0 space-y-3">
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <ZoomOut size={16} className="text-white/60 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <ZoomIn size={16} className="text-white/60 flex-shrink-0" />
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-3">
          <RotateCw size={16} className="text-white/60 flex-shrink-0" />
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <span className="text-white/60 text-xs w-10 text-right flex-shrink-0">{rotation}°</span>
        </div>
      </div>
    </div>
  )
}
