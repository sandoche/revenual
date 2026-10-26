/** Pure startup validation, shared with the configuration regression tests. */
export const validateEnvironment = (env: NodeJS.ProcessEnv): void => {
    const MIN_SECRET_LENGTH = 32
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < MIN_SECRET_LENGTH || /^(change|replace|example|your[-_])/i.test(env.SESSION_SECRET)) {
        throw new Error('Set SESSION_SECRET to a unique random value of at least 32 characters. See README.')
    }
    if (env.BASIC_AUTH_PRIVATE_BETA === 'TRUE' && (!env.BASIC_AUTH_USERNAME || !env.BASIC_AUTH_PASSWORD)) {
        throw new Error('The beta gate requires BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD.')
    }
}
