import React, { useCallback, useEffect, useRef, useState } from "react";
import "rsuite/dist/rsuite.min.css";
import {
  Drawer,
  IconButton,
  CustomProvider,
  Loader,
  Radio,
  RadioGroup,
} from "rsuite";
import {
  tracks,
  getTracks,
  getAuthors,
  getYears,
  getTrackByPos,
} from "./tracks";
import PlayerControl from "./Components/PlayerControl";
import TracksList from "./Components/TrackList";
import AuthorList from "./Components/AuthorList";
import YearList from "./Components/YearList";
import RenderCanvas from "./Components/RenderCanvas.tsx";
import MusicIcon from "@rsuite/icons/legacy/Music";
import InfoIcon from "@rsuite/icons/legacy/InfoCircle";
import AboutDrawer from "./Components/AboutDrawer.js";
import { getHttpParam } from "./Components/mandafunk/tools/http.ts";
import { getRandomOffset, mobileAndTabletCheck } from "./tools.js";
import { ConfigVariations } from "./Components/ConfigVariations.js";
import "./App.css";
import useKeypress from "react-use-keypress";

let mouseTimeout;

function App(props) {
  const ChiptuneJsPlayer = window["ChiptuneJsPlayer"];
  const ChiptuneJsConfig = window["ChiptuneJsConfig"];

  const defaultVolume = 80;
  const player = useRef();
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
  const [authors, setAuthors] = useState(getAuthors(getHttpParam("year") || 0));
  const [selection, setSelection] = useState(
    getHttpParam("selection") || "all"
  );

  // tracks
  const [mods, setMods] = useState(getTracks(year, author, selection));
  const [isPrevTrack, setIsPrevTrack] = useState(false);
  const [isNextTrack, setIsNextTrack] = useState(false);

  // mouse
  const [isMouseMoving, setIsMouseMoving] = useState(false);

  const playOffset = (order) => {
    const track = tracks[parseInt(currentTrack.pos - 1) + order] ?? false;
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

  const updateRouteHttp = () => {
    var url = new URL(window.location.origin);
    var search_params = url.searchParams;

    if (year) {
      search_params.append("year", year);
    }
    if (author) {
      search_params.append("author", author);
    }

    if (selection !== "all") {
      search_params.append("selection", selection);
    }

    if (currentTrack) {
      search_params.append("track", currentTrack.pos);
    }

    if (newconfigOffset) {
      search_params.append("config", newconfigOffset);
    }

    url.search = search_params.toString();

    window.history.pushState(null, null, `?${search_params.toString()}`);
  };

  const filterYear = (y) => {
    setYear(y);
    setAuthors(getAuthors(y));
  };

  const filterAuthor = (a, reset) => {
    if (reset) {
      filterYear(0);
      filterSelection("all");
    }
    setAuthor(a);
  };

  const filterSelection = (s) => {
    setSelection(s);
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
    setAboutOpen(true);
    setOpen(false);
  });
  useKeypress("l", () => {
    setAboutOpen(false);
    setOpen(true);
  });

  useEffect(() => {
    const config = new ChiptuneJsConfig({
      repeatCount: 0,
      volume: defaultVolume,
      context: props.context,
    });
    player.current = new ChiptuneJsPlayer(config);
    player.current.pause();

    if (!currentTrack) {
      const item = tracks[0]; //getRandomItem(tracks);
      setCurrentTrack(item);
    } else {
      const confOffset = newconfigOffset
        ? newconfigOffset
        : getRandomOffset(ConfigVariations, -1);
      currentTrack.shader = confOffset;
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
      }, 2000);
    };
    document.querySelector("body").style.cursor = "none";

    window.addEventListener("mousemove", handleMouse);

    return () => {
      player.current.pause();
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  useEffect(() => {
    const modsList = getTracks(year, author, selection);
    setMods(modsList);
    updateRouteHttp();
  }, [year, author, selection, getTracks, newconfigOffset]);

  useEffect(() => {
    setIsLoading(true);
    setOpen(false);

    if (currentTrack.shader) {
      setNewconfigOffset(currentTrack.shader);
      setNewConfig(ConfigVariations[currentTrack.shader]);
    }

    updateRouteHttp();

    player.current
      .load(`./mods/${currentTrack.url}`)
      .then((buffer) => {
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
      })
      .catch((e) => {
        setIsLoading(false);
        setIsPlay(false);
      });
  }, [currentTrack]);

  return (
    <CustomProvider theme="dark">
      <Drawer
        size={mobileAndTabletCheck() ? "full" : "lg"}
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        // backdrop={false}
      >
        <Drawer.Header>
          <Drawer.Title>Finally the Analogik's MusicDisk</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <h3>Selection</h3>
          <RadioGroup
            inline
            appearance="picker"
            defaultValue="all"
            value={selection}
            onChange={filterSelection}
          >
            <Radio value="all">All</Radio>
            <Radio value="selecta">Selecta</Radio>
            <Radio value="bleep">Bleep</Radio>
          </RadioGroup>
          <div style={{ marginTop: 25 }}>
            <YearList year={year} years={years} filterYear={filterYear} />
          </div>
          <div style={{ marginTop: 25 }}>
            <AuthorList
              author={author}
              authors={authors}
              filterAuthor={filterAuthor}
            />
          </div>
          <div style={{ marginTop: 25 }}>
            <TracksList
              mods={mods}
              currentTrack={currentTrack}
              load={setCurrentTrack}
            />
          </div>
        </Drawer.Body>
      </Drawer>

      {currentTrack &&
      !isLoading &&
      player.current &&
      player.current.currentPlayingNode ? (
        <PlayerControl
          player={player.current}
          currentTrack={currentTrack}
          meta={meta}
          togglePlay={togglePlay}
          isPlay={isPlay}
          setIsPlay={setIsPlay}
          size={size}
          setVolume={setPlayerVolume}
          volume={volume}
          isNextTrack={isNextTrack}
          isPrevTrack={isPrevTrack}
          nextTrack={nextTrack}
          prevTrack={prevTrack}
          lengthTracks={tracks.length}
          isMouseMoving={isMouseMoving}
        />
      ) : (
        <Loader
          speed="fast"
          center={true}
          vertical={true}
          size="lg"
          content="Loading ..."
        />
      )}
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
        size={mobileAndTabletCheck() ? "sm" : "lg"}
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
        size={mobileAndTabletCheck() ? "sm" : "lg"}
      />

      {player.current &&
      currentTrack &&
      !isLoading &&
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
    </CustomProvider>
  );
}

export default App;
