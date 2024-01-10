import React, { useEffect, useRef, useState } from "react";
import {
  tracks,
  getTracks,
  getAuthors,
  getYears,
  getPosTrack,
  getTrackByUrl,
} from "./tracks";
import PlayerControl from "./Components/PlayerControl";
import TracksList from "./Components/TrackList";
import AuthorList from "./Components/AuthorList";
import YearList from "./Components/YearList";
import RenderCanvas from "./Components/RenderCanvas.tsx";
import "rsuite/dist/rsuite.min.css";
import {
  Drawer,
  IconButton,
  CustomProvider,
  Loader,
  Radio,
  RadioGroup,
} from "rsuite";
import PlusIcon from "@rsuite/icons/legacy/Plus";
import QuestionIcon from "@rsuite/icons/legacy/Question";
import "./App.css";
import AboutDrawer from "./Components/AboutDrawer.js";
import { getHttpParam } from "./Components/mandafunk/tools/http.ts";
import { getRandomItem, getRandomOffset } from "./tools.js";

const ChiptuneJsPlayer = window["ChiptuneJsPlayer"];
const ChiptuneJsConfig = window["ChiptuneJsConfig"];

const context = new AudioContext();

const config = new ChiptuneJsConfig({
  repeatCount: 0,
  volume: 90,
  context: context,
});

const player = new ChiptuneJsPlayer(config);
player.pause();

function App() {
  const years = getYears();
  const render = useRef();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [volume, setVolume] = useState(90);

  // tracks
  const [isPlay, setIsPlay] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(
    getTrackByUrl(getHttpParam("track"))
  );
  const [size, setSize] = useState(0);
  const [meta, setMeta] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(0);
  const shader = useRef(getHttpParam("shader") || 0);

  // filters
  const [year, setYear] = useState(getHttpParam("year") || 0);
  const [author, setAuthor] = useState(getHttpParam("author") || 0);
  const [nextTrack, setnextTrack] = useState();
  const [authors, setAuthors] = useState(getAuthors(getHttpParam("year") || 0));
  const [selection, setSelection] = useState(
    getHttpParam("selection") || "all"
  );

  // tracks
  const [mods, setMods] = useState(getTracks(year, author, selection));

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
      search_params.append("track", currentTrack.url);
    }

    if (shader.current) {
      search_params.append("shader", shader.current);
    }

    url.search = search_params.toString();

    window.history.pushState(null, null, `?${search_params.toString()}`);
  };

  const filterYear = (y) => {
    setYear(y);
    setAuthors(getAuthors(y));
  };

  const filterAuthor = (a) => {
    setAuthor(a);
  };

  const filterSelection = (s) => {
    setSelection(s);
  };

  const setPlayerVolume = (value) => {
    setVolume(value);
    player.setVolume(value);
  };

  const togglePlay = () => {
    setIsPlay(!isPlay);
    player.togglePause();
  };

  const onPop = (e) => {
    console.log("updated history");
  };

  const getNexTrack = () => {
    const currentPost = getPosTrack(currentTrack, mods);
    return mods[parseInt(currentPost) + 1] ?? false;
  };

  useEffect(() => {
    window.addEventListener("popstate", onPop);

    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const modsList = getTracks(year, author, selection);
    setMods(modsList);

    if (!currentTrack) {
      const item = getRandomItem(modsList);
      setCurrentTrack(item);
    }

    updateRouteHttp();
  }, [year, author, selection, getTracks]);

  useEffect(() => {
    setIsLoading(true);
    setOpen(false);

    updateRouteHttp();

    player
      .load(`./mods/${currentTrack.url}`)
      .then((buffer) => {
        setIsLoading(false);

        player.pause();
        player.play(buffer);
        player.seek(0);

        player.onEnded(() => {
          const next = getNexTrack();
          console.log("next track in queue", next);

          if (next) {
            setCurrentTrack(next);
          } else {
            player.pause();
            player.seek(0);
          }
        });

        setIsPlay(true);

        setSize(buffer.byteLength);
        setMeta(player.metadata());
        setDuration(player.duration());
      })
      .catch(() => {
        setIsLoading(false);
        setIsPlay(false);
      });
  }, [currentTrack, setIsLoading, setIsPlay, player]);

  return (
    <CustomProvider theme="dark">
      <Drawer
        size="lg"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        // backdrop={false}
      >
        <Drawer.Header>
          <Drawer.Title>Analogik MusicDisk</Drawer.Title>
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
          <br />
          <br />
          <YearList year={year} years={years} filterYear={filterYear} />
          <br />
          <AuthorList
            author={author}
            authors={authors}
            filterAuthor={filterAuthor}
          />
          <br />
          <TracksList
            mods={mods}
            currentTrack={currentTrack}
            load={setCurrentTrack}
          />
          <br />
        </Drawer.Body>
      </Drawer>

      {currentTrack && !isLoading && player.currentPlayingNode ? (
        <PlayerControl
          player={player}
          currentTrack={currentTrack}
          meta={meta}
          togglePlay={togglePlay}
          isPlay={isPlay}
          setIsPlay={setIsPlay}
          size={size}
          setVolume={setPlayerVolume}
          volume={volume}
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
        appearance="primary"
        icon={<PlusIcon />}
        style={{
          position: "absolute",
          bottom: 15,
          right: 15,
          // zoom: 1.4,
          filter: "drop-shadow(0px 0px 20px #000000)",
        }}
        onClick={() => setOpen(true)}
        circle
        size="lg"
      />

      <AboutDrawer open={aboutOpen} setOpen={setAboutOpen} />

      <IconButton
        appearance="primary"
        icon={<QuestionIcon />}
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          // zoom: 1.4,
          filter: "drop-shadow(0px 0px 20px #000000)",
        }}
        onClick={() => setAboutOpen(true)}
        circle
        size="sm"
      />
      {currentTrack && !isLoading && player.currentPlayingNode ? (
        <RenderCanvas
          player={player}
          audioContext={context}
          isPlay={isPlay}
          setIsPlay={setIsPlay}
          shader={shader}
          updateRouteHttp={updateRouteHttp}
          ref={render}
        />
      ) : (
        ""
      )}
    </CustomProvider>
  );
}

export default App;
