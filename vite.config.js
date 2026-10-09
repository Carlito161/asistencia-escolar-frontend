import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && mode === 'production') {
    let url
    try { url = new URL(env.VITE_API_URL) } catch {
      throw new Error('Configura VITE_API_URL en .env.production.local con la URL HTTPS real del backend.')
    }
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname) || url.hostname.endsWith('tudominio.com') || url.username || url.password) {
      throw new Error('VITE_API_URL de producción debe ser una URL HTTPS real, sin credenciales ni dirección local/de ejemplo.')
    }
    if (!url.pathname.replace(/\/$/, '').endsWith('/api/v1') || url.search || url.hash) {
      throw new Error('La URL de API debe terminar en /api/v1, sin query ni fragmento.')
    }
  }
  return {
    server: {
      port: 5173,
      strictPort: true,
    },
    plugins: [
      vue(),
      ...(command === 'serve' && mode === 'development' ? [vueDevTools()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
