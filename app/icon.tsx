import { ImageResponse } from 'next/og';

// Image metadata
export function generateImageMetadata() {
  return [
    {
      id: 'small',
      contentType: 'image/png',
      size: { width: 192, height: 192 },
    },
    {
      id: 'large',
      contentType: 'image/png',
      size: { width: 512, height: 512 },
    },
  ]
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = await id
  const largeIcon= iconId === "large"
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: largeIcon ? 256 : 96,
          background: '#0070f3',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '50%',
          fontWeight: 'bold',
        }}
      >
        N
      </div>
    ),
    {
      width: largeIcon ? 512 : 192,
      height: largeIcon ? 512 : 192,
    }
  )
}