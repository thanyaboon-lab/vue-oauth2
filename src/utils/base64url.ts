import { decode as decodeBase64, encode as encodeBase64 } from 'universal-base64'

export function toBase64(base64url: string): string {
  return base64url
    .padEnd(base64url.length + (4 - base64url.length % 4) % 4, '=')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
}

export function fromBase64(base64: string): string {
  return base64
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .replace(/=+$/, '')
}

export function decode(base64url: string): string {
  return decodeBase64(toBase64(base64url))
}

export function encode(input: string): string {
  return encodeBase64(fromBase64(input))
}
