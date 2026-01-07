/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Configuración para Service Worker
    // El Service Worker debe estar en /public/sw.js para que Next.js lo sirva correctamente
    // No se requiere configuración adicional ya que Next.js sirve automáticamente archivos estáticos de /public
}

module.exports = nextConfig
