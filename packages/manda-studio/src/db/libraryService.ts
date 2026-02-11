import { db } from "./database";
import type { LibraryImage, LibraryAudio, LibraryVideo } from "./libraryTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateImageThumbnail(blob: Blob): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve({ thumbnailUrl, width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const ctx = new AudioContext();
      try {
        const buffer = await ctx.decodeAudioData(reader.result as ArrayBuffer);
        resolve(buffer.duration);
      } catch (err) {
        reject(err);
      } finally {
        await ctx.close();
      }
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsArrayBuffer(blob);
  });
}

function getVideoMeta(blob: Blob): Promise<{ thumbnailUrl: string; duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(blob);
    video.muted = true;
    video.preload = "auto";

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 200;
      const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve({
        thumbnailUrl,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };
    video.src = url;
  });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function getImage(id: number): Promise<LibraryImage | undefined> {
  return await db.libraryImages.get(id);
}

export async function getAllImages(): Promise<LibraryImage[]> {
  return await db.libraryImages.orderBy("createdAt").reverse().toArray();
}

export async function createImage(file: File): Promise<number> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const { thumbnailUrl, width, height } = await generateImageThumbnail(blob);
  return await db.libraryImages.add({
    name: file.name,
    tags: [],
    mimeType: file.type,
    blob,
    thumbnailUrl,
    width,
    height,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteImage(id: number): Promise<void> {
  await db.libraryImages.delete(id);
}

export async function searchImages(query: string): Promise<LibraryImage[]> {
  const lower = query.toLowerCase();
  return await db.libraryImages
    .filter((item) => item.name.toLowerCase().includes(lower))
    .toArray();
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export async function getAudioItem(id: number): Promise<LibraryAudio | undefined> {
  return await db.libraryAudio.get(id);
}

export async function getAllAudio(): Promise<LibraryAudio[]> {
  return await db.libraryAudio.orderBy("createdAt").reverse().toArray();
}

export async function createAudio(file: File): Promise<number> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const duration = await getAudioDuration(blob);
  return await db.libraryAudio.add({
    name: file.name,
    tags: [],
    mimeType: file.type,
    blob,
    duration,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteAudio(id: number): Promise<void> {
  await db.libraryAudio.delete(id);
}

export async function searchAudioItems(query: string): Promise<LibraryAudio[]> {
  const lower = query.toLowerCase();
  return await db.libraryAudio
    .filter((item) => item.name.toLowerCase().includes(lower))
    .toArray();
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export async function getAllVideos(): Promise<LibraryVideo[]> {
  return await db.libraryVideos.orderBy("createdAt").reverse().toArray();
}

export async function createVideo(file: File): Promise<number> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const meta = await getVideoMeta(blob);
  return await db.libraryVideos.add({
    name: file.name,
    tags: [],
    mimeType: file.type,
    blob,
    ...meta,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteVideo(id: number): Promise<void> {
  await db.libraryVideos.delete(id);
}

export async function searchVideos(query: string): Promise<LibraryVideo[]> {
  const lower = query.toLowerCase();
  return await db.libraryVideos
    .filter((item) => item.name.toLowerCase().includes(lower))
    .toArray();
}
