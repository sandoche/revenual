import AppleReporter from 'apple-reporter'

export const checkAppleToken = async (id: string, token: string): Promise<boolean> => {
    const reporter = new AppleReporter({
        userid: id,
        accesstoken: token
    })

    try {
        const status = await reporter.Finance.getStatus()
        return status.Status.Code.includes('0')
    } 
    catch(e) {
        return false
    }
}

