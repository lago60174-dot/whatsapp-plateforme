import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Augmente le timeout des fonctions serverless à 60s
    // Nécessaire pour les appels Gemini + recherche vectorielle
    serverActions: {
      bodySizeLimit: '10mb', // Pour l'upload des PDFs
    },
  },
}

export default nextConfig
