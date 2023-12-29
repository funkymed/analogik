import { ConfigType } from './types/config.ts'

export const configDefault: ConfigType = {
    scene: {
        bgColor: '',
        background: '',
        blur: 0,
        brightness: 100,
        shader: '',
        shader_speed: 1,
        shader_opacity: 1.0,
    },
    music: '',
    timer: {
        show: true,
        color: '#ffffff',
        bgColor: false,
        opacity: 0.7000000000000001,
        order: 1,
        width: 512,
        height: 64,
        size: 20,
        font: 'Kdam Thmor Pro',
        align: 'center',
        x: 0,
        y: -227.4,
        z: -500,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    },

    progressbar: {
        show: true,
        color: '#ffffff',
        cursorColor: '#ffffff',
        bgColor: false,
        opacity: 0.32,
        order: 1,
        width: 512,
        height: 64,
        x: 0,
        y: -185.4,
        z: -500,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    },
    vumeters: {
        oscilloscop: {
            show: true,
            color: '#ffffff',
            bgColor: false,
            motionBlur: true,
            motionBlurLength: 0.25,
            opacity: 1,
            order: 1,
            width: 1024,
            height: 92,
            x: 0,
            y: 0,
            z: -250,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        },
        spectrum: {
            show: true,
            color: '#ffffff',
            bgColor: false,
            multiColor: true,
            motionBlur: true,
            motionBlurLength: 0.25,
            opacity: 0.6900000000000001,
            order: 1,
            bars: 128,
            width: 512,
            height: 48,
            x: 0,
            y: -156.3,
            z: -500,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        },
    },
    composer: {
        bloom: {
            show: true,
            strength: 0.85,
            threshold: 0.73,
            radius: 0.30000000000000004,
        },
        rgb: { show: false, amount: 0.005, angle: 0.7 },
        film: {
            show: true,
            count: 1000,
            sIntensity: 0.22,
            nIntensity: 0.59,
            grayscale: false,
        },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0, saturation: 0 },
    },
    images: [],
    texts: [],
}

const updaters: any = []

export const addUpdater = function (updater: Function) {
    updaters.push(updater)
}

export const updateAll = function () {
    for (let i of updaters) {
        updaters[i]()
    }
}
