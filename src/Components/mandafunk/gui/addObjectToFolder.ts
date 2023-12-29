import { GUI } from 'dat.gui'
import { isColor } from '../tools/isColor'
import { selectImagesPochette, selectImagesVinyl, varFloat, varFont, varAlign, varShader } from './options'

export const addObjectToFolder = function (folder: GUI, obj: any, callback: any | undefined): GUI {
    for (const item in obj) {
        if (typeof obj[item] === 'object' || Array.isArray(obj[item])) {
            addObjectToFolder(folder, obj[item], false)
        } else if (typeof obj[item] === 'number') {
            if (varFloat[item]) {
                if (item === 'blur' || item === 'brightness') {
                    folder
                        .add(obj, item, varFloat[item][0], varFloat[item][1], varFloat[item][2])
                        .onFinishChange(callback)
                } else {
                    folder
                        .add(obj, item, varFloat[item][0], varFloat[item][1], varFloat[item][2])
                        .onChange(callback)
                }
            } else if (folder.name.indexOf('Images/') != -1 && ['x', 'y', 'z'].includes(item)) {
                if (item == 'z') {
                    folder.add(obj, item, -5, -1, 0.01).onChange(callback)
                } else {
                    folder.add(obj, item, -2, 2, 0.01).onChange(callback)
                }
            } else if (
                (folder.name.indexOf('Texts/') != -1 ||
                    folder.name.indexOf('Timer') != -1 ||
                    folder.name.indexOf('Vumeters/') != -1 ||
                    folder.name.indexOf('Progress') != -1) &&
                ['x', 'y', 'z'].includes(item)
            ) {
                if (item == 'z') {
                    folder.add(obj, item, -650, -1, 0.1).onChange(callback)
                } else {
                    folder.add(obj, item, -650, 650, 0.1).onChange(callback)
                }
            } else {
                folder.add(obj, item).onChange(callback)
            }
        } else if (typeof obj[item] === 'boolean') {
            folder.add(obj, item).onChange(callback)
        } else {
            if (obj[item] && isColor(obj[item])) {
                folder.addColor(obj, item).onChange(callback)
            } else {
                if (folder.name.indexOf('vinyl') != -1 && obj.path) {
                    folder.add(obj, item, selectImagesVinyl).onChange(callback)
                } else if (folder.name.indexOf('pochette') != -1 && obj.path) {
                    folder.add(obj, item, selectImagesPochette).onChange(callback)
                } else if (folder.name.indexOf('image-') != -1 && obj.path) {
                    folder.add(obj, item, selectImagesPochette).onChange(callback)
                } else if (item === 'background' && obj.background) {
                    folder.add(obj, item, selectImagesPochette).onChange(callback)
                } else if (item === 'font') {
                    folder.add(obj, item, varFont).onChange(callback)
                } else if (item === 'shader') {
                    folder.add(obj, item, varShader).onChange(callback)
                } else if (item === 'align') {
                    folder.add(obj, item, varAlign).onChange(callback)
                } else {
                    folder.add(obj, item).onChange(callback)
                }
            }
        }
    }
    return folder
}
