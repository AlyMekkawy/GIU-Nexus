import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default ({ mode }) => {
 
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],

    //idk if this is needed
    
    define: {
      'import.meta.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || ''),
    },

   
    server: {
      proxy: {
        '/api': {
       
          target: env.BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}
