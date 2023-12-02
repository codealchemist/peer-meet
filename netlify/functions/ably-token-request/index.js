import * as dotenv from 'dotenv'
import * as Ably from 'ably/promises'
import { HandlerEvent, HandlerContext } from '@netlify/functions'

dotenv.config()
const ABLY_API_KEY = process.env.ABLY_API_KEY
const DEFAULT_CLIENT_ID = process.env.DEFAULT_CLIENT_ID

console.log(`
  · ABLY_API_KEY: ${ABLY_API_KEY}
  · DEFAULT_CLIENT_ID: ${DEFAULT_CLIENT_ID}
`)

export async function handler(event, context) {
  if (!ABLY_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(`
        Missing ABLY_API_KEY environment variable.
        If you're running locally, please ensure you have a ./.env file with a value for ABLY_API_KEY=your-key.
        If you're running in Netlify, make sure you've configured env variable ABLY_API_KEY.
      `)
    }
  }

  const clientId = event.queryStringParameters['clientId'] || DEFAULT_CLIENT_ID || 'NO_CLIENT_ID'
  const client = new Ably.Rest(ABLY_API_KEY)
  const tokenRequestData = await client.auth.createTokenRequest({ clientId }, { key: ABLY_API_KEY })
  console.log(`- GOT TOKEN: ${tokenRequestData}`)

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(tokenRequestData)
  }
}
