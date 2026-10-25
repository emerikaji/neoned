import { ImageResponse } from 'next/og';

// Image metadata
export function generateImageMetadata() {
  return [
    {
      id: 'small.png',
      contentType: 'image/png',
      size: { width: 192, height: 192 },
    },
    {
      id: 'smallmask.png',
      contentType: 'image/png',
      size: { width: 192, height: 192 },
    },
    {
      id: 'large.png',
      contentType: 'image/png',
      size: { width: 512, height: 512 },
    },
    {
      id: 'largemask.png',
      contentType: 'image/png',
      size: { width: 512, height: 512 },
    },
  ]
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = (await id as string).split('.')[0]
  const largeIcon= iconId.startsWith("large")
  const maskableIcon = iconId.endsWith("mask")
  const iconSize = largeIcon ? 512 : 192
  const fontSize= maskableIcon ? 0.5*iconSize : 0.75*iconSize

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: fontSize,
          background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: maskableIcon ? '' : '28%',
          fontWeight: 'bold',
        }}
      >
        🚊
      </div>
    ),
    {
      width: iconSize,
      height: iconSize,
    }
  )
}