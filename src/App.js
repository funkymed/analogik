import React, { useEffect, useRef, useState } from "react";
import { IconButton, CustomProvider } from "rsuite";
import Preloader from "assets-preloader";
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
import RenderCanvas from "./Components/RenderCanvas.tsx";
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

let mouseTimeout;
let tweenAnim;
function App(props) {
  const ChiptuneJsPlayer = window["ChiptuneJsPlayer"];
  const ChiptuneJsConfig = window["ChiptuneJsConfig"];

  const defaultVolume = 80;
  const player = useRef();
  const mainView = useRef();
  const requestRef = useRef();

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
  const [mods, setMods] = useState(getTracks(year, author, selection));
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [isCustomPlaylist, setIsCustomPlaylist] = useState(false);
  const [isPrevTrack, setIsPrevTrack] = useState(false);
  const [isNextTrack, setIsNextTrack] = useState(false);

  // mouse
  const [isMouseMoving, setIsMouseMoving] = useState(false);

  const playOffset = (order) => {
    const track =
      currentPlaylist[parseInt(currentTrack.pos - 1) + order] ?? false;
    if (track) {
      setCurrentTrack(track);
    }
  };

  const nextTrack = () => {
    playOffset(1);
  };

  const prevTrack = () => {
    playOffset(-1);
  };

  const filterSelection = (s) => {
    setYear(0);
    setAuthor(0);
    setSelection(s);
    setAuthors(getAuthors(0, s));
  };

  const filterYear = (y) => {
    setAuthor(0);
    setYear(y);
    setAuthors(getAuthors(y, selection));
  };

  const filterAuthor = (a, reset) => {
    if (reset) {
      filterYear(0);
      filterSelection("all");
    }
    setAuthor(a);
  };

  const setPlayerVolume = (value) => {
    setVolume(value);
    player.current.setVolume(value);
  };

  const togglePlay = () => {
    setIsPlay(!isPlay);
    player.current.togglePause();
  };

  const updateControlBtn = () => {
    let isPrev = false;
    let isNext = false;
    const posOffset = currentTrack.pos ? currentTrack.pos - 1 : 0;

    isPrev = posOffset > 0 ? true : false;
    isNext = posOffset < tracks.length - 1 ? true : false;

    setIsPrevTrack(isPrev);
    setIsNextTrack(isNext);
  };

  const onClickCanvas = (e) => {
    const pos = e.screenX / window.innerWidth;
    player.current.seek(pos * player.current.duration());
  };

  useKeypress("i", () => {
    setOpen(false);
    setAboutOpen(!aboutOpen);
  });
  useKeypress("p", () => {
    setAboutOpen(false);
    setOpen(!open);
  });

  const getPlayer = () => {
    const config = new ChiptuneJsConfig({
      repeatCount: 0,
      volume: defaultVolume,
      context: props.context,
    });

    player.current = new ChiptuneJsPlayer(config);
    player.current.pause();
  };

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

    const handleMouse = (event) => {
      setIsMouseMoving(true);
      document.querySelector("body").style.cursor = "auto";
      if (mouseTimeout) {
        clearTimeout(mouseTimeout);
      }
      mouseTimeout = setTimeout(() => {
        setIsMouseMoving(false);
        document.querySelector("body").style.cursor = "none";
      }, 100);
    };
    document.querySelector("body").style.cursor = "none";

    window.addEventListener("mousemove", handleMouse);

    requestRef.current = requestAnimationFrame(animationLoop);

    return () => {
      player.current.pause();
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const modsList = getTracks(year, author, selection);
    setMods(modsList);
    updateRouteHttp(
      year,
      author,
      selection,
      currentTrack ? currentTrack.pos : null,
      newconfigOffset
    );
  }, [year, author, selection, getTracks, newconfigOffset]);

  useEffect(() => {
    if (tweenAnim) {
      TWEEN.remove(tweenAnim);
    }

    if (mainView.current) {
      const animTime = 300;
      mainView.current.style.opacity = 1;
      tweenAnim = new TWEEN.Tween(mainView.current.style)
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
          setTimeout(loadTrack, 1000);
          // Preload before load track
          if (_conf) {
            const assets = [
              _conf.scene.background,
              `./mods/${currentTrack.url}`,
              "./fonts/Lobster-Regular.ttf",
              "./fonts/KdamThmorPro-Regular.ttf",
              "./images/empty_warehouse_01_2k.hdr",
            ];

            const loader = new Preloader(assets);
            loader.load().then(() => {
              console.log("success");
            });
          }
        })
        .start();
    }
  }, [currentTrack]);

  const loadTrack = () => {
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

      if (tweenAnim) {
        TWEEN.remove(tweenAnim);
      }
      mainView.current.style.opacity = 0;
      tweenAnim = new TWEEN.Tween(mainView.current.style)
        .to({ opacity: 1 }, animTime)
        .delay(animTime)
        .start();
    });
  };

  const animationLoop = () => {
    TWEEN.update();
    requestRef.current = requestAnimationFrame(animationLoop);
  };

  const PlayListControl = (clear) => {
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

    for (let r in playlist) {
      playlist[r].pos = parseInt(r) + 1;
    }

    setCurrentPlaylist(playlist);
    setCurrentTrack(playlist[0]);
  };

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
      {isLoading ? <Loader /> : ""}
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
        style={{
          position: "absolute",
          bottom: 15,
          right: 15,
          // zoom: 1.4,
          filter: "drop-shadow(0px 0px 20px #000000)",
        }}
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
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          // zoom: 1.4,
          filter: "drop-shadow(0px 0px 20px #000000)",
        }}
        onClick={() => setAboutOpen(true)}
        circle
        size={isMobile ? "sm" : "lg"}
      />
      <div ref={mainView}>
        {player.current &&
        currentTrack &&
        player.current.currentPlayingNode &&
        newConfig ? (
          <RenderCanvas
            player={player.current}
            audioContext={props.context}
            isPlay={isPlay}
            setIsPlay={setIsPlay}
            newConfig={newConfig}
            onClickCanvas={onClickCanvas}
          />
        ) : (
          ""
        )}
      </div>
    </CustomProvider>
  );
}

export default App;
