import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const soapUrl = env.VITE_SOAP_API_URL || 'https://codesoap.onrender.com';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/soap-api': {
          target: soapUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/soap-api/, '')
        }
      }
    }
  }
})
