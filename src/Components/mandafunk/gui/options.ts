import { shaders } from '../fx/shaders/background'

export const selectImagesPochette: string[] = [
    '',
    './images/rr-med-until-now.jpg',
    "./images/taxi.jpg",
    './images/w1.jpg',
    './images/w2.jpg',
    './images/w3.jpg',
    './images/w4.jpg',
    './images/w5.jpg',
    './images/w6.jpg',
    './images/w6.jpg',
    './images/pochette.png',
    './images/pochette2.jpeg',
    './images/pochette3.jpg',
    './playlists/in-troubles/cover.jpg',
    './playlists/around-my-cream/cover.jpg',
    './images/star.png',
    './images/star2.png',
    './images/spark.png',
    './playlists/around-my-cream/strawberry.png',
    './playlists/around-my-cream/icecream.png',
    './playlists/around-my-cream/juice.png',
]

export const selectImagesVinyl: string[] = [
    '',
    './images/vinyl.png',
    './images/vinyl2.png',
    './images/vinyl3.png',
    './images/vinyl4.png',
    './images/vinyl5.png',
    './images/vinyl6.png',
    './images/vinyl7.png',
    './images/vinyl8.png',
    './images/vinyl9.png',
    './images/vinyla.png',
    './images/vinylb.png',
    './images/vinyl-rr-med.png',
    './images/vinyl-cream.png',
]

export const varFloat: any = {
    blur: [0, 200, 1],
    hue: [0, 1, 0.01],
    saturation: [0, 1, 0.01],
    brightness: [0, 200, 1],
    opacity: [0, 1, 0.01],
    width: [0, 1024, 1],
    height: [0, 1024, 1],
    bars: [0, 256, 1],
    amount: [0, 1, 0.001],
    count: [0, 1000, 1],
    size: [0, 256, 1],
    radius: [0, 10, 0.1],
    threshold: [0, 1, 0.01],
    strength: [0, 1, 0.01],
    angle: [0, 2, 0.01],
    sIntensity: [0, 3, 0.01],
    nIntensity: [0, 3, 0.01],
    rotationX: [-2, 2, 0.01],
    rotationY: [-2, 2, 0.01],
    rotationZ: [-2, 2, 0.01],
    cylindricalRatio: [0.25, 4, 0.1]
}

export const varFont: string[] = [
    'Arial',
    'Helvetica',
    'Robot',
    'Verdana',
    'East Sea Dokdo',
    'Alfa Slab One',
    'Lobster',
    'Pacifico',
    'Permanent Marker',
    'Kdam Thmor Pro',
]

export const varAlign = ['left', 'center']

export const varShader = ['']
for (let k in shaders) {
    varShader.push(k)
}
