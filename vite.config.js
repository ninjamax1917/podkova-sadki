import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

const shouldCompress = (file) => {
  return /\.(?:js|css|html|svg|xml|json|txt|ico|map|woff|woff2)$/.test(file)
}

export default defineConfig({
  plugins: [
  tailwindcss(),
  // Gzip и Brotli версии файлов для Nginx (static precompression)
  viteCompression({ algorithm: 'gzip', ext: '.gz', filter: shouldCompress }),
  viteCompression({ algorithm: 'brotliCompress', ext: '.br', compressionOptions: { level: 11 }, filter: shouldCompress }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
})
