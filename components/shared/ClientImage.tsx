// components/shared/ClientImage.tsx
"use client"

import Image, { ImageProps } from "next/image"

type StaticImport = {
  src: string
  height: number
  width: number
  blurDataURL?: string
}

const ClientImage = (props: ImageProps) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.onerror = null
    
    // Handle both string and imported image cases
    let srcString = ''
    if (typeof props.src === 'string') {
      srcString = props.src
    } else if (props.src && typeof props.src === 'object' && 'src' in props.src) {
      srcString = props.src.src
    }

    target.src = srcString.startsWith('http') 
      ? '/assets/images/placeholder.jpg' 
      : srcString || '/assets/images/placeholder.jpg'
  }

  return (
    <Image
      {...props}
      alt={props.alt || "Image"}
      onError={handleError}
    />
  )
}

export default ClientImage