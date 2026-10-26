import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const readGoogleCredentials = () => {
    const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (!configuredPath) throw new Error('Google Play reporting is not configured.')
    const keyFile = path.resolve(process.cwd(), configuredPath)
    let credentials: any
    try {
        credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'))
    } catch (error) {
        throw new Error('The Google service-account JSON key could not be read.')
    }
    if (!credentials || typeof credentials !== 'object' || credentials.type !== 'service_account' || typeof credentials.client_email !== 'string' ||
        !/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(credentials.client_email) ||
        typeof credentials.private_key !== 'string' || !credentials.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('The Google service-account JSON key is invalid.')
    }
    try {
        crypto.createPrivateKey(credentials.private_key)
    } catch (error) {
        throw new Error('The Google service-account JSON key is invalid.')
    }
    return { keyFile, email: credentials.client_email as string }
}

export const getGoogleAccountDisplay = () => {
    try {
        return { serviceAccountEmail: readGoogleCredentials().email, googleConfigurationError: '' }
    } catch (error) {
        return { serviceAccountEmail: '', googleConfigurationError: (error as Error).message }
    }
}
