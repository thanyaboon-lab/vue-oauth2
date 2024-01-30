import express from 'express'
import type { CookieOptions, Request, Response, Router } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { BaseClient, Issuer } from 'openid-client'
import CryptoES from 'crypto-es'
import * as base64url from '../../utils/base64url'

type JWKS = ReturnType<typeof createRemoteJWKSet>

const stateCookieOption: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
}

let openidConnectDiscoverPublic: Issuer<BaseClient>
let openidClientPublic: BaseClient
let openidConnectDiscoverInternal: Issuer<BaseClient>
let openidClientInternal: BaseClient
let getJWKS: JWKS

export async function discover(){
  openidConnectDiscoverPublic = await Issuer.discover(process.env.OPENID_ISSUER!)
  openidClientPublic = new openidConnectDiscoverPublic.Client({
    client_id: '768128715192-4krjqg3qr90lk0457l96otbnn8i6nfkk.apps.googleusercontent.com',
    client_secret: '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'
  })

  openidConnectDiscoverInternal = await Issuer.discover(process.env.INTERNAL_WEB_API!)
  openidClientInternal = new openidConnectDiscoverInternal.Client({
    client_id: '768128715192-4krjqg3qr90lk0457l96otbnn8i6nfkk.apps.googleusercontent.com',
    client_secret: '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'
  })
  getJWKS = createRemoteJWKSet(new URL(openidConnectDiscoverInternal.metadata.jwks_uri!), { cacheMaxAge: 86400000 })
  console.log('🚀 ~ openidConnectDiscoverInternal:', openidConnectDiscoverInternal.metadata)
}

function readAccessTokenFromCookies(req: Request) {
  if (!req.cookies.access_token)
    return undefined
  return CryptoES.AES.decrypt(req.cookies.access_token, process.env.AES_KEY!).toString(CryptoES.enc.Utf8)
}

async function isTokenValid(accessToken?: string) {
  console.log('🚀 ~ accessToken:', accessToken)
  if (!accessToken)
    return false

  return await jwtVerify(accessToken, getJWKS, {
    issuer: process.env.OPENID_ISSUER!,
    // audience: process.env.OPENID_ISSUER!,
  })
    .then(() => true)
    .catch((err) => {
      console.log('🚀 ~ err:', err)
      return false
    })
}

const router: Router = express.Router()

const callbackUrl = new URL('api/callback', process.env.VITE_SITE_ENDPOINT!).href

router.get('/callback', async (req: Request<null, null, null, { code: string; state: string }>, res: Response) => {
  const state = req.query.state
  console.log('/callback code', req.query.code)
  console.log('/callback state', state)

  const params = openidClientInternal.callbackParams(req)
  console.log('🚀 ~ params:', params)
  const tokenResult = await openidClientInternal.callback(callbackUrl, params, { state })
  console.log('🚀 ~ tokenResult:', tokenResult)
  const tokenValid = await isTokenValid(tokenResult.id_token)
  console.log('🚀 ~ isTokenValid:', tokenValid)

  res.send('<h1>params: '+ JSON.stringify(params) +'</h1><br><h1>tokenResult: '+ JSON.stringify(tokenResult) +'</h1>')
})

router.get('/login', async (req: Request<ParamsDictionary, null, null, { redirectUri?: string }>, res: Response) => {
  try {
    const redirectUri = JSON.stringify({ redirectUri: req.query.redirectUri })
    console.log('🚀 ~ redirectUri:', redirectUri)
    const base64 = CryptoES.AES.encrypt(redirectUri, process.env.AES_KEY!).toString()
    console.log('🚀 ~ base64:', base64)
    const state = base64url.fromBase64(base64)
    const existingStates = req.cookies.state ? JSON.parse(req.cookies.state) : []
    
    const redirectUrl = openidClientPublic.authorizationUrl({
      scope: 'email profile openid',
      state,
      response_type: 'code',
      redirect_uri: callbackUrl
    })
    console.log('🚀 ~ redirectUrl:', redirectUrl)
    res.cookie('state', JSON.stringify([...existingStates, state]), stateCookieOption)
    console.log('/login state', state)
    res.redirect(redirectUrl)
  } catch(ex) {
    console.log('login exception', ex)
    res.sendStatus(500)
  }
})

export default router
