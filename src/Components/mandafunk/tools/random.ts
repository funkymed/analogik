export function getRandomArbitrary(min: number, max: number, zero: boolean) {
    let n = Math.round(Math.random() * (max - min) + min)
    return zero && n < 10 ? `0${n}` : n
}
