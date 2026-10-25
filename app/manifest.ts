import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Neoned: Nantes transportation built for the modern Web.',
    short_name: 'Neoned',
    description: 'A Progressive Web App to browse nearby stations and obtain the next arrivals.',
    categories: ["travel", "navigation"],
    prefer_related_applications: false,
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon/small',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon/smallmask',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon/large',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon/largemask',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}