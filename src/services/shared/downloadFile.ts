import fetch from 'node-fetch'
import fs from 'fs'
import { FILE_DIRECTORY } from '../../config/directory'

const downloadFile = async (url: string, name: string, bearer: string): Promise<void> => {
    const res = await fetch(url, {
        headers: {'Authorization': bearer}
    })
    await new Promise<void>((resolve, reject) => {
        const fileStream = fs.createWriteStream(FILE_DIRECTORY + name)
        res.body.pipe(fileStream)
        res.body.on('error', (err) => {
            reject(err)
        })
        fileStream.on('finish', function () {
            resolve()
        })
    })
}

export default downloadFile
