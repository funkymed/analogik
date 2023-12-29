import { ConfigType } from '../types/config.ts'

export class Audio {
    config: ConfigType
    audio: HTMLAudioElement
    analyser: AnalyserNode

    constructor(config: ConfigType) {
        this.config = config
        this.audio = document.createElement('audio')
        const context: any = new window.AudioContext()
        this.analyser = context.createAnalyser()
        this.analyser.fftSize = 2048
        this.analyser.maxDecibels = -10
        this.analyser.minDecibels = -90
        this.analyser.smoothingTimeConstant = 0.05;
        const source = context.createMediaElementSource(this.audio)
        source.connect(this.analyser)
        this.analyser.connect(context.destination)
    }
    onAudioEnd() {}

    getAnalyser(): AnalyserNode {
        return this.analyser
    }

    getAudio(): HTMLAudioElement {
        return this.audio
    }

    isPlaying() {
        return (
            this.audio &&
            this.audio.currentTime > 0 &&
            !this.audio.paused &&
            !this.audio.ended &&
            this.audio.readyState > 2
        )
    }

    stopAudio() {
        this.audio.pause()
        this.audio.currentTime = 0
    }

    initAudio() {
        if (this.isPlaying()) {
            this.stopAudio()
        }
        this.audio = document.createElement('audio')
        this.audio.preload = 'auto'
        this.audio.src = unescape(this.config.music)
        this.audio.onended = this.onAudioEnd.bind(this)
        const context = new window.AudioContext()
        this.analyser = context.createAnalyser()
        this.analyser.fftSize = 2048 * 2
        const source = context.createMediaElementSource(this.audio)
        source.connect(this.analyser)
        this.analyser.connect(context.destination)
    }

    play() {
        this.audio.play()
    }

    update(config: ConfigType) {
        this.config = config
        if (this.audio) {
            this.audio.pause()
        }
        this.initAudio()
    }
}
