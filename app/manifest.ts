import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Que memória?',
    short_name: 'Que memória?',
    description: 'Jogo da memória multiplayer',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6efe1',
    theme_color: '#f6efe1',
    icons: [{ src: '/icone.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
