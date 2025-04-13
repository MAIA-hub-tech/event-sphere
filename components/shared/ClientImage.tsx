'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

export default function ClientImage(props: ImageProps) {
  const [src, setSrc] = useState(props.src);

  return (
    <Image
      {...props}
      src={src}
      onError={() => setSrc('/assets/images/event-placeholder.jpg')}
    />
  );
}