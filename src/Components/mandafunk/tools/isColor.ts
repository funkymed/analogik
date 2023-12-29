export function isColor(strColor: string) {
    var s = new Option().style
    s.color = strColor
    var test1 = s.color == strColor
    var test2 = /^#[0-9A-F]{6}$/i.test(strColor)
    if (test1 == true || test2 == true) {
        return true
    } else {
        return false
    }
}
