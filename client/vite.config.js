import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default ({ mode }) => {
 
  // Load env from both client/ and the server/ directory (where .env lives)
  const clientEnv = loadEnv(mode, process.cwd(), '');
  const serverEnv = loadEnv(mode, path.resolve(process.cwd(), '../server'), '');
  const env = { ...serverEnv, ...clientEnv };

  const backendUrl = env.BACKEND_URL || `http://localhost:${env.PORT || 5004}`;

  return defineConfig({
    plugins: [react()],

    define: {
      'import.meta.env.BACKEND_URL': JSON.stringify(backendUrl),
    },

   
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}
