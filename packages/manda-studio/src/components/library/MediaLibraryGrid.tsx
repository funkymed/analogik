import { useState, useCallback, useRef } from "react";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import Music from "lucide-react/dist/esm/icons/music.js";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.js";
import { useLibrary } from "@/hooks/useLibrary";
import type { LibraryImage, LibraryAudio, LibraryVideo } from "@/db/libraryTypes";

type MediaType = "images" | "audio" | "videos";

interface MediaLibraryGridProps {
  type: MediaType;
  searchQuery: string;
}

const ACCEPT_MAP: Record<MediaType, string> = {
  images: "image/*",
  audio: "audio/*",
  videos: "video/*",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isImage(item: LibraryImage | LibraryAudio | LibraryVideo): item is LibraryImage {
  return "width" in item && !("duration" in item);
}

function isAudio(item: LibraryImage | LibraryAudio | LibraryVideo): item is LibraryAudio {
  return "duration" in item && !("width" in item);
}

function isVideo(item: LibraryImage | LibraryAudio | LibraryVideo): item is LibraryVideo {
  return "duration" in item && "width" in item;
}

export function MediaLibraryGrid({ type, searchQuery }: MediaLibraryGridProps) {
  const { items, loading, setSearchQuery, addFile, deleteItem } = useLibrary(type);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external search query
  useState(() => {
    setSearchQuery(searchQuery);
  });

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          await addFile(file);
        }
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [addFile],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      setUploading(true);
      try {
        for (const file of files) {
          await addFile(file);
        }
      } finally {
        setUploading(false);
      }
    },
    [addFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: LibraryImage | LibraryAudio | LibraryVideo) => {
      e.dataTransfer.setData(
        "application/x-manda-library",
        JSON.stringify({ type, id: item.id }),
      );
    },
    [type],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteItem(id);
    },
    [deleteItem],
  );

  return (
    <div
      className={`flex flex-1 flex-col overflow-y-auto p-3 ${
        dragging ? "ring-2 ring-inset ring-indigo-500" : ""
      }`}
      onDrop={(e) => void handleDrop(e)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Upload button */}
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={uploading}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 py-3 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300"
      >
        {uploading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        {uploading ? "Uploading..." : `Drop or click to add ${type}`}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_MAP[type]}
        multiple
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-zinc-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-xs text-zinc-500">
          No {type} yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="group relative cursor-grab overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800/50 transition-colors hover:border-zinc-600 active:cursor-grabbing"
            >
              {/* Thumbnail area */}
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900">
                {isImage(item) && item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : isVideo(item) && item.thumbnailUrl ? (
                  <>
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] text-zinc-300">
                      {formatDuration(item.duration)}
                    </span>
                  </>
                ) : isAudio(item) ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <Music size={20} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">
                      {formatDuration(item.duration)}
                    </span>
                  </div>
                ) : null}

                {/* Hover delete */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => item.id !== undefined && void handleDelete(item.id)}
                    className="rounded-md bg-red-700 p-2 text-white transition-colors hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="p-2">
                <p className="truncate text-xs text-zinc-300" title={item.name}>
                  {item.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
