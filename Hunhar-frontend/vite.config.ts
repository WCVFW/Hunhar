import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function phaseSyncPlugin(): Plugin {
  const syncFile = path.resolve(__dirname, '.phase_sync_store.json')
  let store: Record<string, any> = {}

  try {
    if (fs.existsSync(syncFile)) {
      store = JSON.parse(fs.readFileSync(syncFile, 'utf-8'))
    }
  } catch { }

  const save = () => {
    try {
      fs.writeFileSync(syncFile, JSON.stringify(store, null, 2), 'utf-8')
    } catch { }
  }

  return {
    name: 'phase-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/_phase_sync_all' || req.url.startsWith('/_phase_sync_all?'))) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(store))
          return
        }
        if (req.url && req.url.startsWith('/_phase_sync/')) {
          const key = decodeURIComponent(req.url.replace('/_phase_sync/', '').split('?')[0])
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(store[key] || null))
            return
          }
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => {
              try {
                store[key] = JSON.parse(body)
                save()
              } catch { }
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(JSON.stringify({ ok: true, data: store[key] }))
            })
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), phaseSyncPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
