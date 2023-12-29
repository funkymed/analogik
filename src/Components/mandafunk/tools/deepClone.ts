export const deepClone = function (obj: any) {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj)
    }
    return JSON.parse(JSON.stringify(obj))
}
