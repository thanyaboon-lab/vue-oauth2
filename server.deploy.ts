import express from 'express'
import compression from 'compression'
import api from './src/server'
// import { discover } from './src/server/oauth/index'

process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

async function createServer() {
  // await discover()

  const app = express()

  app.use(compression())

  app.use(api)

  app.use(express.static(__dirname + '/public'))

  app.use('*', express.static(__dirname + '/public'))

  app.listen(5173, () => {
    console.log('listening to: http://localhost:5173')
  })
}

createServer()
