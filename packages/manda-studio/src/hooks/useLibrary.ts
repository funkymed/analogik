import { useState, useEffect, useCallback, useRef } from "react";
import type { LibraryImage, LibraryAudio, LibraryVideo } from "@/db/libraryTypes";
import {
  getAllImages,
  createImage,
  deleteImage,
  searchImages,
  getAllAudio,
  createAudio,
  deleteAudio,
  searchAudioItems,
  getAllVideos,
  createVideo,
  deleteVideo,
  searchVideos,
} from "@/db/libraryService";

type LibraryItem = LibraryImage | LibraryAudio | LibraryVideo;
type MediaType = "images" | "audio" | "videos";

const SEARCH_DEBOUNCE_MS = 300;

export function useLibrary(type: MediaType) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let result: LibraryItem[];
      if (type === "images") result = await getAllImages();
      else if (type === "audio") result = await getAllAudio();
      else result = await getAllVideos();
      setItems(result);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSearchQuery = useCallback(
    (q: string) => {
      setSearchQueryState(q);

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }

      if (q.trim() === "") {
        void refresh();
        return;
      }

      debounceRef.current = setTimeout(() => {
        void (async () => {
          setLoading(true);
          try {
            let result: LibraryItem[];
            if (type === "images") result = await searchImages(q);
            else if (type === "audio") result = await searchAudioItems(q);
            else result = await searchVideos(q);
            setItems(result);
          } finally {
            setLoading(false);
          }
        })();
      }, SEARCH_DEBOUNCE_MS);
    },
    [refresh, type],
  );

  const addFile = useCallback(
    async (file: File): Promise<number> => {
      let id: number;
      if (type === "images") id = await createImage(file);
      else if (type === "audio") id = await createAudio(file);
      else id = await createVideo(file);
      await refresh();
      return id;
    },
    [type, refresh],
  );

  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      if (type === "images") await deleteImage(id);
      else if (type === "audio") await deleteAudio(id);
      else await deleteVideo(id);
      await refresh();
    },
    [type, refresh],
  );

  return {
    items,
    loading,
    searchQuery,
    setSearchQuery,
    addFile,
    deleteItem,
    refresh,
  };
}
