import { GUI } from 'dat.gui'
import { ConfigType, ImageType } from '../types/config.ts'
import { addObjectToFolder } from './addObjectToFolder.ts'
import { Composer } from '../fx/composer.ts'
import { StaticItems } from '../fx/static.ts'
import { updateImageFast, updateImages } from '../fx/image.ts'
import { updateTexts } from '../fx/text.ts'
import { MandaScene } from '../scene.ts'

 // Playlist
 const playlist = [
    "playlists/rr-med-until-now/01.json",
    "playlists/rr-med-until-now/02.json",
    "playlists/rr-med-until-now/03.json",
    "playlists/rr-med-until-now/04.json",
    "playlists/rr-med-until-now/05.json",
    "playlists/rr-med-until-now/06.json",
    "playlists/rr-med-until-now/07.json",
    "playlists/rr-med-until-now/08.json",
    "playlists/rr-med-until-now/09.json",
    "playlists/rr-med-until-now/10.json",
    "playlists/rr-med-until-now/11.json",
    "playlists/rr-med-until-now/12.json",
]

const playlistConfig = { track: playlist[0] }

export class Editor {
    gui: GUI
    config: ConfigType
    guiButtons: any
    scene: MandaScene
    composer: Composer
    staticItems: StaticItems
    loader: Function

    constructor(
        config: ConfigType,
        scene: MandaScene,
        composer: Composer,
        staticItems: StaticItems,
        loader: Function
    ) {
        this.gui = new GUI()
        this.config = config
        this.scene = scene
        this.composer = composer
        this.staticItems = staticItems
        this.loader = loader
    }

    show(display: boolean) {
        if (display) {
            this.gui.show()
        } else {
            this.gui.hide()
        }
    }

    updateConfig(config: ConfigType) {
        this.config = config
    }

    addText() {}

    addImage() {}

    loadConfig(value: string) {
        this.loader(value)
    }

    updateComposer(config: ConfigType) {
        this.composer.updateComposer(config)
        this.updateConfig(config)
    }

    updateImageFaster(name: string, configImage: ImageType) {
        updateImageFast(name, this.scene.getScene(), configImage)
    }

    updateImage(config: ConfigType) {
        updateImages(this.scene.getScene(), config)
        this.updateConfig(config)
    }

    updateText(config: ConfigType) {
        updateTexts(this.scene.getScene(), config)
        this.updateConfig(config)
    }

    updateStatic(config: ConfigType) {
        this.staticItems.update(config)
        this.updateConfig(config)
    }

    updateAll() {
        this.staticItems.update(this.config)
        this.composer.updateComposer(this.config)
        this.scene.updateSceneBackground(this.config)
    }

    updateGui(config: ConfigType) {
        this.config = config
        let self: Editor = this

        const guiButtons = {
            save: function () {
                console.log(JSON.stringify(config))
            },
            addText: function () {
                const countTexts = Object.keys(config.texts).length
                const key = `text-${countTexts + 1}`
                console.log(key)
                // config.texts['text-' + (countTexts + 1)] = {
                //     show: true,
                //     text: 'Default text',
                //     order: 0,
                //     x: 0,
                //     y: 0,
                //     z: -650,
                //     rotationX: 0,
                //     rotationY: 0,
                //     rotationZ: 0,
                //     size: 18,
                //     color: '#FFFFFF',
                //     opacity: 0.75,
                // }
                self.updateGui(config)
            },
            addImage: function () {
                const countTexts = Object.keys(config.images).length
                const key = `image-${countTexts + 1}`
                console.log(key)
                // config.images['image-' + (countTexts + 1)] = {
                //     show: true,
                //     path: './images/w1.jpg',
                //     x: 0,
                //     y: 0,
                //     z: -2,
                //     rotationX: 0,
                //     rotationY: 0,
                //     rotationZ: 0,
                //     order: 0,
                // }
                self.updateGui(config)
            },
            delete: function () {},

            updateAll: self.updateAll.bind(this),
        }

        if (this.gui) {
            this.gui.destroy()
        }
        this.gui = new GUI()
        this.gui.useLocalStorage = true

        // PLAYLIST
        const playlistFolder = this.gui.addFolder('Playlist')
        playlistFolder.add(playlistConfig, 'track', playlist).onChange(function (value: any) {
            playlistConfig.track = value
            self.loadConfig(value)
        })

        // SCENE
        const sceneFolder = this.gui.addFolder('Scene')
        addObjectToFolder(sceneFolder, config.scene, function (value: any) {
            self.scene.updateSceneBackground(config)
        })

        // MUSIC
        const musicFolder = this.gui.addFolder('Music')
        musicFolder.add(config, 'music').onChange(function (value) {})

        // TIMER
        const timerFolder = this.gui.addFolder('Timer')
        addObjectToFolder(timerFolder, config.timer, function (value: any) {
            self.updateStatic(config)
        })

        // PROGRESSBAR
        const progressbarFolder = this.gui.addFolder('Progress bar')
        addObjectToFolder(progressbarFolder, config.progressbar, function (value: any) {
            self.updateStatic(config)
        })

        // VUMETERS
        for (let [key, value] of Object.entries(config.vumeters)) {
            const folderOsc = this.gui.addFolder(`Vumeters/${key}`)
            addObjectToFolder(folderOsc, value, function (value: any) {
                self.updateStatic(config)
            })
        }

        // COMPOSERS
        for (let [key, value] of Object.entries(config.composer)) {
            let folder = this.gui.addFolder(`Composer/${key}`)
            addObjectToFolder(folder, value, function (value: any) {
                self.updateComposer(config)
            })
        }

        // TEXTS
        for (let [item, configText] of Object.entries(config.texts)) {
            let folder = this.gui.addFolder(`Texts/${item}`)
            addObjectToFolder(folder, configText, function (value: any) {
                self.updateText(config)
            })
            folder.add(guiButtons, 'delete', item).onChange(function () {
                // config.texts[item] = undefined
                console.log('delete', item)
                self.updateGui(config)
                self.updateAll()
            })
        }
        // IMAGES
        for (let [key, configImage] of Object.entries(config.images)) {
            let folder = this.gui.addFolder(`Images/${key}`)

            addObjectToFolder(folder, configImage, function (value: any) {
                if (typeof value === 'string') {
                    self.updateImage(config)
                } else {
                    self.updateImageFaster(key, configImage)
                }
            })
            folder.add(guiButtons, 'delete', key).onChange(function () {
                // delete config.images[key]
                self.updateGui(config)
                self.updateAll()
            })
        }

        this.gui.add(guiButtons, 'addText')
        this.gui.add(guiButtons, 'addImage')
        this.gui.add(guiButtons, 'updateAll')
        this.gui.add(guiButtons, 'save')
    }
}
