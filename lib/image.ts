// Image compression and utility functions

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8
const MAX_FILE_SIZE = 500 * 1024 // 500KB target

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  mimeType: string
}

export async function compressImage(file: File | Blob): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if exceeds max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Try JPEG first, fall back to lower quality if too large
      let quality = JPEG_QUALITY
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }

            if (blob.size > MAX_FILE_SIZE && quality > 0.3) {
              quality -= 0.1
              tryCompress()
              return
            }

            resolve({
              blob,
              width,
              height,
              mimeType: 'image/jpeg',
            })
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix to get pure base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

export function createImageURL(blob: Blob): string {
  return URL.createObjectURL(blob)
}
