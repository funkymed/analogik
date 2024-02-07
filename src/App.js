import React, { useEffect, useRef, useState } from "react";
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
  getPosTrack,
  getTrackByUrl,
} from "./tracks";
import PlayerControl from "./Components/PlayerControl";
import TracksList from "./Components/TrackList";
import AuthorList from "./Components/AuthorList";
import YearList from "./Components/YearList";
import RenderCanvas from "./Components/RenderCanvas.tsx";
import PlusIcon from "@rsuite/icons/legacy/Plus";
import QuestionIcon from "@rsuite/icons/legacy/Question";
import AboutDrawer from "./Components/AboutDrawer.js";
import { getHttpParam } from "./Components/mandafunk/tools/http.ts";
import { getRandomItem, getRandomOffset } from "./tools.js";
import { ConfigVariations } from "./Components/ConfigVariations.js";
import "./App.css";

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
    getTrackByUrl(getHttpParam("track"))
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

  const onPop = (e) => {
    console.log("updated history", e);
  };

  const getNexTrack = () => {
    const currentPost = getPosTrack(currentTrack, mods);
    return mods[parseInt(currentPost) + 1] ?? false;
  };

  const onClickCanvas = (e) => {
    const pos = e.screenX / window.innerWidth;
    console.log(e);
    player.current.seek(pos * player.current.duration());
  };

  useEffect(() => {
    const config = new ChiptuneJsConfig({
      repeatCount: 0,
      volume: defaultVolume,
      context: props.context,
    });
    player.current = new ChiptuneJsPlayer(config);
    player.current.pause();

    // window.addEventListener("popstate", onPop);
    const confOffset = newconfigOffset
      ? newconfigOffset
      : getRandomOffset(ConfigVariations, -1);

    if (!currentTrack) {
      const item = getRandomItem(tracks);

      item.shader = confOffset;

      setCurrentTrack(item);
    } else {
      currentTrack.shader = confOffset;
    }

    return () => {
      player.current.pause();
      // window.removeEventListener("popstate", onPop);
      // window.removeEventListener("mouseup", onClickCanvas);
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

        player.current.pause();
        player.current.play(buffer);
        player.current.seek(0);

        player.current.onEnded(() => {
          const next = getNexTrack();
          if (next) {
            setCurrentTrack(next);
          } else {
            player.current.pause();
            player.current.seek(0);
          }
        });

        setIsPlay(true);

        setSize(buffer.byteLength);
        setMeta(player.current.metadata());
        setDuration(player.current.duration());
      })
      .catch((e) => {
        console.log(e);
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

      <AboutDrawer
        aboutOpen={aboutOpen}
        setAboutOpen={setAboutOpen}
        filterAuthor={filterAuthor}
        setTrackDrawerOpen={setOpen}
      />

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
