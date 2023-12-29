import { ConfigType } from './types/config.ts'

export function loadJson(url: string) {
    let loading = true
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'json'
        xhr.onload = function () {
            loading = false
            var status = xhr.status
            if (status >= 200 && status < 300) {
                const config: ConfigType = xhr.response
                resolve(config)
            } else {
                reject(xhr.statusText)
            }
        }
        xhr.send()
    })
}
