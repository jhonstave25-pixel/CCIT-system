"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type UploaderProps = {
  accept: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  onChange: (files: File[]) => void
  className?: string
  cta?: string
  note?: string
}

export function Uploader({
  accept,
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 20,
  onChange,
  className,
  cta = "Select Files",
  note,
}: UploaderProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [drag, setDrag] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function apply(next: File[]) {
    // size & count guards
    const trimmed = next.slice(0, maxFiles).filter((f) => f.size <= maxSizeMB * 1024 * 1024)
    setFiles(trimmed)
    onChange(trimmed)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    apply(multiple ? [...files, ...dropped] : dropped.slice(0, 1))
    setDrag(false)
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    apply(multiple ? [...files, ...picked] : picked.slice(0, 1))
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    onChange(next)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          drag ? "border-indigo-300 bg-indigo-500/20" : "border-white/30 bg-white/5 hover:bg-white/10"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-white/80 text-sm">Drag & drop here, or click to upload.</p>
        {note && <p className="text-white/60 text-xs mt-1">{note}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handlePick}
        />
        <Button
          type="button"
          className="mt-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          {cta}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/")
            const isVideo = f.type.startsWith("video/")
            const url = URL.createObjectURL(f)

            return (
              <div key={i} className="relative rounded-lg overflow-hidden border border-white/20 bg-white/10">
                {isImage ? (
                  <img src={url} alt={f.name} className="w-full h-36 object-cover" />
                ) : isVideo ? (
                  <video src={url} className="w-full h-36 object-cover" controls />
                ) : (
                  <div className="h-36 grid place-items-center text-white/80 text-xs p-4 break-all">
                    {f.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

