import dotenv from 'dotenv'
import { validateEnvironment } from '../config/environment'

// The example file is documentation, never a source of runtime secrets.
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: '.env' })
validateEnvironment(process.env)
export const ENVIRONMENT = process.env.NODE_ENV
export const SESSION_SECRET = process.env.SESSION_SECRET
export const MONGODB_URI = ENVIRONMENT === 'production' ? process.env.MONGODB_URI : process.env.MONGODB_URI_LOCAL
if (!MONGODB_URI) throw new Error('Set MONGODB_URI_LOCAL (development) or MONGODB_URI (production). See README.')
