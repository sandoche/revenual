import { getToken } from '../../shared/getGoogleplayToken'
import { getReportList } from '../../reports/utils/downloadReportGoogleplay'
import { parseUri } from '../../shared/googleplayUriParser'

export const checkGoogleAccess = async (data: any, parse: boolean): Promise<boolean> => {
    try {
        const accessToken = await getToken()
        const bearer = `Bearer ${accessToken}`
        let uri

        if (parse) {
            uri = parseUri(data.uri)
        } else {
            uri = data.uri
        }

        const reportList = await getReportList(bearer, uri, null, null)

        return !(typeof reportList === 'undefined')
    } catch (err) {
        return false
    }
}
