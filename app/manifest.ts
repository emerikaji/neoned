import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Neoned: Nantes transportation built for the modern Web.',
    short_name: 'Neoned',
    description: 'A Progressive Web App to browse nearby stations and obtain the next arrivals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon/small',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon/large',
        sizes: '512x512',
        type: 'image/png'
      },
    ],
  }
}