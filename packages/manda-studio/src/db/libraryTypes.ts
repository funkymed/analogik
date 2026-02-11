export interface LibraryImage {
  id?: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;
  thumbnailUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface LibraryAudio {
  id?: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;
  duration: number;
  createdAt: string;
}

export interface LibraryVideo {
  id?: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  createdAt: string;
}
