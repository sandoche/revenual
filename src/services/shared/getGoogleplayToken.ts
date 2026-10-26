import { GoogleToken } from 'gtoken'
import { readGoogleCredentials } from '../../config/google'

export const getToken = async () => {
    const { keyFile } = readGoogleCredentials()
    try {
        const gtoken = new GoogleToken({ keyFile, scope: ['https://www.googleapis.com/auth/devstorage.read_only'] })
        const tokens = await gtoken.getToken()
        return tokens.access_token
    } catch (error) {
        // Do not attach upstream errors containing Authorization headers or keys.
        throw new Error('Google Play authentication failed. Check the service-account key and reporting permissions.')
    }
}
