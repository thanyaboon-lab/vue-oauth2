import express from 'express'
import { createServer as createViteServer } from 'vite'
import api from './src/server'
import { discover } from './src/server/oauth/index'

async function createServer() {
  await discover()

  const app = express()

  app.use(api)

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })

  app.use(vite.middlewares)

  app.listen(14755, () => {
    console.log('listening to: http://localhost:14755')
  })
}

createServer()
