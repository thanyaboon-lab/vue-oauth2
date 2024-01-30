import express from 'express'
import cookieParser from 'cookie-parser'
import oauth from './oauth'
import example from './example'

const router = express.Router()

router.use(cookieParser())
router.use(oauth)
router.use(example)

export default express
  .Router()
  .use('/api', router)
