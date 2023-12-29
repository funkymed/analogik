export function cutHex(h: any) {
    return h.charAt(0) === '#' ? h.substring(1, 7) : h
}

export function hexToR(h: any) {
    return parseInt(cutHex(h).substring(0, 2), 16)
}

export function hexToG(h: any) {
    return parseInt(cutHex(h).substring(2, 4), 16)
}

export function hexToB(h: any) {
    return parseInt(cutHex(h).substring(4, 6), 16)
}

export function hextoRGB(h: any) {
    return [hexToR(h), hexToG(h), hexToB(h)].join(',')
}
