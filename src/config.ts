const testConfig: any = {
    scene: {
        bgColor: '#000000',
        background: './images/w1.jpg',
        blur: 25,
        brightness: 100,
        shader: 'NeonWave',
        shader_speed: 1.25,
        shader_opacity: 0.25,
    },
    music: './playlists/test/pirequeca.mp3',
    timer: {
        order: 0,
        show: true,
        color: '#ffffff',
        bgColor: false,
        opacity: 0.2,
        width: 512,
        height: 64,
        size: 18,
        font: 'Lobster',
        align: 'center',
        x: 0,
        y: -240,
        z: -650,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    },
    progressbar: {
        order: 1,
        show: true,
        color: '#ffffff',
        cursorColor: '#ffffff',
        bgColor: false,
        opacity: 0.6,
        width: 512,
        height: 64,
        x: 0,
        y: -200,
        z: -650,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    },
    vumeters: {
        oscilloscop: {
            order: 1,
            show: true,
            color: '#00a4ff',
            bgColor: false,
            motionBlur: true,
            motionBlurLength: 0.25,
            opacity: 1,
            width: 1024,
            height: 92,
            x: 0,
            y: 0,
            z: -339.70000000000005,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        },
        spectrum: {
            show: true,
            color: '#ffffff',
            bgColor: false,
            multiColor: false,
            motionBlur: false,
            centerSpectrum: false,
            motionBlurLength: 0.15,
            opacity: 0.3,
            bars: 128,
            width: 496,
            height: 100,
            x: 0,
            y: -142,
            z: -650,
            zoom: 1,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        },
    },
    composer: {
        bloom: { show: true, strength: 0.85, threshold: 0.8300000000000001, radius: 3.7 },
        rgb: { show: false, amount: 0.003, angle: 0.7 },
        film: {
            show: false,
            count: 1000,
            sIntensity: 0.9400000000000001,
            nIntensity: 0.38,
            grayscale: false,
        },
        static: { show: false, amount: 0.065, size: 10 },
        lens: {
            show: true,
            strength: 0.43,
            cylindricalRatio: 1.9000000000000001,
            height: 1,
        },
    },
    images: {},
    texts: {},
}

export default testConfig
