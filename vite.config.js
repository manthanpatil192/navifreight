import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path configuration: '/navifreight/' for production GitHub Pages build, '/' for local dev server
export default defineConfig(({ command }) => {
  // If deployed on Render or root path hosting, use '/'. If deploying to GitHub Pages, use '/navifreight/'
  const basePath = (process.env.RENDER || process.env.VITE_BASE_PATH === '/')
    ? '/' 
    : (process.env.NODE_ENV === 'production' || command === 'build' ? '/navifreight/' : '/');

  return {
    base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
  }
};
})
