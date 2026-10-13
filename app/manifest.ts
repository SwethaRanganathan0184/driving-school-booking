import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DriveWise',
    short_name: 'DriveWise',
    description: 'Book driving lessons with trusted local instructors.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070B14',
    theme_color: '#070B14',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
