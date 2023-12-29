export function getHttpParam(param: string): string | boolean {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    return urlParams.get(param) ?? false
}
