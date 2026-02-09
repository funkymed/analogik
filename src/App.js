import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IconButton from "rsuite/IconButton";
import CustomProvider from "rsuite/CustomProvider";
import {
  tracks,
  getTracks,
  getAuthors,
  getYears,
  getTrackByPos,
} from "./tracks";
import TWEEN from "@tweenjs/tween.js";
import PlayerControl from "./Components/PlayerControl";
import useKeypress from "react-use-keypress";
import MusicIcon from "@rsuite/icons/legacy/Music";
import InfoIcon from "@rsuite/icons/legacy/InfoCircle";
import AboutDrawer from "./Components/AboutDrawer.js";
import "rsuite/dist/rsuite.min.css";
import { getHttpParam } from "./Components/mandafunk/tools/http.ts";
import { getRandomOffset, updateRouteHttp } from "./tools.js";
import { ConfigVariations } from "./Components/ConfigVariations.js";
import "./App.css";
import PlaylistDrawer from "./Components/PlayListDrawer.js";
import Loader from "./Components/Loader.js";
import { isMobile } from "react-device-detect";

// Lazy load RenderCanvas to reduce initial bundle size
const RenderCanvas = React.lazy(() => import("./Components/RenderCanvas.tsx"));

// Hoisted static styles
const MUSIC_ICON_BUTTON_STYLE = {
  position: "absolute",
  bottom: 15,
  right: 15,
  filter: "drop-shadow(0px 0px 20px #000000)",
};

const INFO_ICON_BUTTON_STYLE = {
  position: "absolute",
  top: 15,
  right: 15,
  filter: "drop-shadow(0px 0px 20px #000000)",
};

// Custom preload functions for parallel asset loading
const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`[Preload] Image loaded: ${url}`);
      resolve(img);
    };
    img.onerror = (err) => {
      console.error(`[Preload] Failed to load image: ${url}`, err);
      reject(err);
    };
    img.src = url;
  });
};

const preloadAudio = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        console.log(`[Preload] Audio loaded: ${url}`);
        resolve(blob);
      })
      .catch((err) => {
        console.error(`[Preload] Failed to load audio: ${url}`, err);
        reject(err);
      });
  });
};

const preloadFont = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        console.log(`[Preload] Font loaded: ${url}`);
        resolve(blob);
      })
      .catch((err) => {
        console.error(`[Preload] Failed to load font: ${url}`, err);
        reject(err);
      });
  });
};

const preloadHDR = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        console.log(`[Preload] HDR loaded: ${url}`);
        resolve(blob);
      })
      .catch((err) => {
        console.error(`[Preload] Failed to load HDR: ${url}`, err);
        reject(err);
      });
  });
};

function App(props) {
  const ChiptuneJsPlayer = window["ChiptuneJsPlayer"];
  const ChiptuneJsConfig = window["ChiptuneJsConfig"];

  const defaultVolume = 80;
  const player = useRef();
  const mainView = useRef();
  const requestRef = useRef();
  const mouseTimeoutRef = useRef();
  const isMouseMovingRef = useRef(false);
  const tweenAnimRef = useRef();

  const years = getYears();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);

  // tracks
  const [isPlay, setIsPlay] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(
    getTrackByPos(getHttpParam("track"))
  );
  const [size, setSize] = useState(0);
  const [meta, setMeta] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(0);
  const [newConfig, setNewConfig] = useState(null);
  const [newconfigOffset, setNewconfigOffset] = useState(
    getHttpParam("config") || null
  );

  // filters
  const [year, setYear] = useState(getHttpParam("year") || 0);
  const [author, setAuthor] = useState(getHttpParam("author") || 0);
  const [authors, setAuthors] = useState(
    getAuthors(getHttpParam("year") || 0, getHttpParam("selection") || "all")
  );
  const [selection, setSelection] = useState(
    getHttpParam("selection") || "all"
  );

  // tracks
  const mods = useMemo(
    () => getTracks(year, author, selection),
    [year, author, selection]
  );
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [isCustomPlaylist, setIsCustomPlaylist] = useState(false);
  const [isPrevTrack, setIsPrevTrack] = useState(false);
  const [isNextTrack, setIsNextTrack] = useState(false);

  // mouse
  const [isMouseMoving, setIsMouseMoving] = useState(false);

  const playOffset = useCallback((order) => {
    const track =
      currentPlaylist[parseInt(currentTrack.pos - 1) + order] ?? false;
    if (track) {
      setCurrentTrack(track);
    }
  }, [currentPlaylist, currentTrack]);

  const nextTrack = useCallback(() => {
    playOffset(1);
  }, [playOffset]);

  const prevTrack = useCallback(() => {
    playOffset(-1);
  }, [playOffset]);

  const filterSelection = useCallback((s) => {
    setYear(0);
    setAuthor(0);
    setSelection(s);
    setAuthors(getAuthors(0, s));
  }, []);

  const filterYear = useCallback((y) => {
    setAuthor(0);
    setYear(y);
    setAuthors(getAuthors(y, selection));
  }, [selection]);

  const filterAuthor = useCallback((a, reset) => {
    if (reset) {
      filterYear(0);
      filterSelection("all");
    }
    setAuthor(a);
  }, [filterYear, filterSelection]);

  const setPlayerVolume = useCallback((value) => {
    setVolume(value);
    player.current.setVolume(value);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlay((prev) => !prev);
    player.current.togglePause();
  }, []);

  const updateControlBtn = useCallback(() => {
    let isPrev = false;
    let isNext = false;
    const posOffset = currentTrack.pos ? currentTrack.pos - 1 : 0;

    isPrev = posOffset > 0;
    isNext = posOffset < tracks.length -1;

    setIsPrevTrack(isPrev);
    setIsNextTrack(isNext);
  }, [currentTrack]);

  const onClickCanvas = useCallback((e) => {
    const pos = e.screenX / window.innerWidth;
    player.current.seek(pos * player.current.duration());
  }, []);

  useKeypress("i", () => {
    setOpen(false);
    setAboutOpen(!aboutOpen);
  });
  useKeypress("p", () => {
    setAboutOpen(false);
    setOpen(!open);
  });

  const getPlayer = useCallback(() => {
    const config = new ChiptuneJsConfig({
      repeatCount: 0,
      volume: defaultVolume,
      context: props.context,
    });

    player.current = new ChiptuneJsPlayer(config);
    player.current.pause();
  }, [props.context]);

  useEffect(() => {
    getPlayer();
    setCurrentPlaylist(tracks);
    if (!currentTrack) {
      setCurrentTrack(tracks[0]); //getRandomItem(tracks);
    } else {
      const confOffset = newconfigOffset
        ? newconfigOffset
        : getRandomOffset(ConfigVariations, -1);
      currentTrack.shader = currentTrack.shader || confOffset;
    }

    const bodyEl = document.body;
    bodyEl.style.cursor = "none";

    const handleMouse = () => {
      if (!isMouseMovingRef.current) {
        isMouseMovingRef.current = true;
        setIsMouseMoving(true);
        bodyEl.style.cursor = "auto";
      }

      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }

      mouseTimeoutRef.current = setTimeout(() => {
        isMouseMovingRef.current = false;
        setIsMouseMoving(false);
        bodyEl.style.cursor = "none";
      }, 100);
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });

    requestRef.current = requestAnimationFrame(animationLoop);

    return () => {
      player.current.pause();
      window.removeEventListener("mousemove", handleMouse);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    updateRouteHttp(
      year,
      author,
      selection,
      currentTrack ? currentTrack.pos : null,
      newconfigOffset
    );
  }, [year, author, selection, currentTrack, newconfigOffset]);

  useEffect(() => {
    if (tweenAnimRef.current) {
      TWEEN.remove(tweenAnimRef.current);
    }

    if (mainView.current) {
      const animTime = 300;
      mainView.current.style.opacity = 1;
      tweenAnimRef.current = new TWEEN.Tween(mainView.current.style)
        .to({ opacity: 0 }, animTime)
        .onComplete(async () => {
          let _conf = false;
          if (currentTrack.shader) {
            setNewconfigOffset(currentTrack.shader);
            setNewConfig(ConfigVariations[currentTrack.shader]);
            _conf = ConfigVariations[currentTrack.shader];
          }

          updateRouteHttp(
            year,
            author,
            selection,
            currentTrack ? currentTrack.pos : null,
            newconfigOffset
          );

          if (player.current && player.current.currentPlayingNode) {
            player.current.pause();
            player.current.seek(0);
          }

          getPlayer();
          setIsLoading(true);
          setIsPlay(false);

          // Preload before load track - PARALLEL LOADING
          if (_conf) {
            console.log("[Preload] Starting parallel asset preload...");
            const startTime = performance.now();

            // Parallelize independent asset loading
            Promise.all([
              preloadImage(_conf.scene.background),
              preloadAudio(`./mods/${currentTrack.url}`),
              Promise.all([
                preloadFont("./fonts/Lobster-Regular.ttf"),
                preloadFont("./fonts/KdamThmorPro-Regular.ttf")
              ]),
              preloadHDR("./images/empty_warehouse_01_2k.hdr")
            ])
            .then(() => {
              const loadTime = performance.now() - startTime;
              console.log(`[Preload] All assets loaded successfully in ${loadTime.toFixed(2)}ms`);
            })
            .catch((error) => {
              console.error("[Preload] Error loading assets:", error);
            });
          }

          setTimeout(loadTrack, 1000);
        })
        .start();
    }
  }, [currentTrack]);

  const loadTrack = useCallback(() => {
    const animTime = 300;
    player.current.load(`./mods/${currentTrack.url}`).then((buffer) => {
      setIsLoading(false);
      updateControlBtn();

      player.current.pause();
      player.current.play(buffer);
      player.current.seek(0);

      if (isNextTrack) {
        player.current.onEnded(nextTrack);
      }

      setIsPlay(true);
      setSize(buffer.byteLength);
      setMeta(player.current.metadata());
      setDuration(player.current.duration());

      if (tweenAnimRef.current) {
        TWEEN.remove(tweenAnimRef.current);
      }
      mainView.current.style.opacity = 0;
      tweenAnimRef.current = new TWEEN.Tween(mainView.current.style)
        .to({ opacity: 1 }, animTime)
        .delay(animTime)
        .start();
    });
  }, [currentTrack, isNextTrack, nextTrack, updateControlBtn]);

  const animationLoop = () => {
    TWEEN.update();
    requestRef.current = requestAnimationFrame(animationLoop);
  };

  const PlayListControl = useCallback((clear) => {
    player.current.pause();
    player.current.seek(0);

    let playlist;
    if (clear) {
      setIsCustomPlaylist(false);
      playlist = tracks;
    } else {
      setIsCustomPlaylist(true);
      playlist = mods;
    }

    playlist.forEach((track, index) => {
      track.pos = index + 1;
    });

    setCurrentPlaylist(playlist);
    setCurrentTrack(playlist[0]);
  }, [mods]);

  return (
    <CustomProvider theme="dark">
      <PlaylistDrawer
        open={open}
        setOpen={setOpen}
        mods={mods}
        PlayListControl={PlayListControl}
        isCustomPlaylist={isCustomPlaylist}
        year={year}
        years={years}
        filterYear={filterYear}
        selection={selection}
        filterSelection={filterSelection}
        author={author}
        authors={authors}
        currentTrack={currentTrack}
        setCurrentTrack={setCurrentTrack}
        filterAuthor={filterAuthor}
      />
      {isLoading ? <Loader /> : null}
      <PlayerControl
        player={player.current}
        currentTrack={currentTrack}
        meta={meta}
        togglePlay={togglePlay}
        isPlay={isPlay}
        isLoading={isLoading}
        setIsPlay={setIsPlay}
        size={size}
        setVolume={setPlayerVolume}
        volume={volume}
        isNextTrack={isNextTrack}
        isPrevTrack={isPrevTrack}
        nextTrack={nextTrack}
        prevTrack={prevTrack}
        lengthTracks={currentPlaylist.length}
        isMouseMoving={isMouseMoving}
      />

      <IconButton
        className={!isMouseMoving ? "hide" : ""}
        appearance="primary"
        icon={<MusicIcon />}
        style={MUSIC_ICON_BUTTON_STYLE}
        onClick={() => setOpen(true)}
        circle
        size={isMobile ? "sm" : "lg"}
      />
      <AboutDrawer
        aboutOpen={aboutOpen}
        setAboutOpen={setAboutOpen}
        filterAuthor={filterAuthor}
        setTrackDrawerOpen={setOpen}
      />
      <IconButton
        className={!isMouseMoving ? "hide" : ""}
        appearance="primary"
        icon={<InfoIcon />}
        style={INFO_ICON_BUTTON_STYLE}
        onClick={() => setAboutOpen(true)}
        circle
        size={isMobile ? "sm" : "lg"}
      />
      <div ref={mainView}>
        {player.current &&
        currentTrack &&
        player.current.currentPlayingNode &&
        newConfig ? (
          <React.Suspense fallback={<Loader />}>
            <RenderCanvas
              player={player.current}
              audioContext={props.context}
              isPlay={isPlay}
              setIsPlay={setIsPlay}
              newConfig={newConfig}
              onClickCanvas={onClickCanvas}
            />
          </React.Suspense>
        ) : null}
      </div>
    </CustomProvider>
  );
}

export default App;
