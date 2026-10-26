module.exports = {
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
    testMatch: ['**/test/**/*.test.(ts|js)'],
    testEnvironment: 'node',
    testTimeout: 120000,
    setupFiles: ['<rootDir>/test/setup.js']
}
