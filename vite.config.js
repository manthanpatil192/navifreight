import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function navifreightApiPlugin() {
  return {
    name: 'navifreight-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        const url = rawUrl.split('?')[0]

        if (url === '/api/news' || url === '/api/refresh-news') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (url === '/api/refresh-news') {
            try {
              const scriptPath = path.resolve(__dirname, 'scripts', 'fetch_live_news_rss.py')
              if (fs.existsSync(scriptPath)) {
                await new Promise((resolve) => {
                  const py = spawn('python', [scriptPath], { timeout: 12000 })
                  py.on('close', () => resolve(true))
                  py.on('error', () => resolve(false))
                })
              }
            } catch (err) {
              console.warn('[Vite API] News refresh error:', err)
            }
          }

          const dataPaths = [
            path.resolve(__dirname, 'src', 'data', 'liveMarketNews.json'),
            path.resolve(__dirname, 'public', 'data', 'liveMarketNews.json')
          ]

          for (const dp of dataPaths) {
            if (fs.existsSync(dp)) {
              try {
                const content = fs.readFileSync(dp, 'utf8')
                res.statusCode = 200
                res.end(content)
                return
              } catch (_) {}
            }
          }

          res.statusCode = 200
          res.end(JSON.stringify({ articles: [], metadata: { status: 'fallback' } }))
          return
        }
        next()
      })
    }
  }
}

// Base path: relative './' works seamlessly on GitHub Pages subpaths, Render root domains, and local dev
export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      navifreightApiPlugin()
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
  }
})
