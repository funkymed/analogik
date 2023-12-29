import {
    CanvasTexture,
    LinearFilter,
    LinearMipmapNearestFilter,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Vector3,
} from 'three'

export const createMesh = function (
    name: string,
    image: any,
    options: any,
    isCanvas: boolean
): Mesh {
    const map = isCanvas ? new CanvasTexture(image) : image

    map.magFilter = LinearFilter
    map.minFilter = LinearMipmapNearestFilter
    map.needsUpdate = options.needsUpdate || true

    const material = new MeshBasicMaterial({
        depthTest: false,
        transparent: true,
        map: map,
        opacity: options.opacity || 1,
    })

    const zoom: number = options.zoom ?? 1
    const width: number = options.width ?? image.width ?? 1
    const height: number = options.height ?? image.height ?? 1
    const plane: PlaneGeometry = new PlaneGeometry(width * zoom, height * zoom)
    const mesh: any = new Mesh(plane, material)

    if (options.objType) {
        mesh.objType = options.objType
    }

    const center: Vector3 = new Vector3()
    mesh.geometry.computeBoundingBox()
    mesh.geometry.boundingBox.getCenter(center)
    mesh.geometry.center()
    mesh.position.copy(center)

    mesh.name = name
    mesh.overdraw = true
    mesh.renderOrder = options.order || 0
    mesh.position.set(options.x || 0, options.y || 0, options.z || 0)
    mesh.rotation.set(options.rotationX || 0, options.rotationY || 0, options.rotationZ || 0)

    // mesh.material.blending = AdditiveBlending

    return mesh
}
