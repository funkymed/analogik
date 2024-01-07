import React, { useEffect, useRef, useState } from "react";
import { getTracks, getAuthors, getYears } from "./tracks";
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

  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [volume, setVolume] = useState(90);

  // tracks
  const [isPlay, setIsPlay] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [size, setSize] = useState(0);
  const [meta, setMeta] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(0);

  // filters
  const [year, setYear] = useState(0);
  const [author, setAuthor] = useState(0);
  const [authors, setAuthors] = useState(getAuthors(year));
  const [selection, setSelection] = useState("all");
  // tracks
  const [mods, setMods] = useState(getTracks(year, author, selection));

  const filterYear = (y) => {
    setYear(y);
    updateFilers(y, author, selection);
  };

  const filterAuthor = (a) => {
    setAuthor(a);
    updateFilers(year, a, selection);
  };

  const filterSelection = (s) => {
    setSelection(s);
    updateFilers(year, author, s);
  };

  const updateFilers = (y, a, s) => {
    setAuthors(getAuthors(y));
    setMods(getTracks(y, a, s));
  };

  const getPosTrack = (track, arr) => {
    for (let t in arr) {
      if (track.url === arr[t].url) {
        return t;
      }
    }
  };

  const loadTrack = (track) => {
    console.log("load", track);
    setIsLoading(true);
    setOpen(false);
    player
      .load(`./mods/${track.url}`)
      .then((buffer) => {
        setIsLoading(false);

        player.pause();
        player.play(buffer);
        player.seek(0);
        const currentPost = getPosTrack(track, mods);
        const nextTrack = mods[parseInt(currentPost) + 1] ?? false;
        console.log("next track in queue", nextTrack);
        player.onEnded(() => {
          if (nextTrack) {
            loadTrack(nextTrack);
          } else {
            player.pause();
            player.seek(0);
          }
        });

        setIsPlay(true);
        setCurrentTrack(track);
        setSize(buffer.byteLength);
        setMeta(player.metadata());
        setDuration(player.duration());
      })
      .catch(() => {
        setIsLoading(false);
        setIsPlay(false);
      });
  };

  const setPlayerVolume = (value) => {
    setVolume(value);
    player.setVolume(value);
  };

  const togglePlay = () => {
    setIsPlay(!isPlay);
    player.togglePause();
  };

  useEffect(() => {
    var item = mods[Math.floor(Math.random() * mods.length)];
    loadTrack(item);
  }, []);

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
            load={loadTrack}
          />
          <br />
        </Drawer.Body>
      </Drawer>

      {currentTrack && !isLoading ? (
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
        <Loader backdrop content="loading..." vertical />
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
      <RenderCanvas
        player={player}
        context={context}
        isPlay={isPlay}
        setIsPlay={setIsPlay}
        currentTrack={currentTrack}
        isLoading={isLoading}
      />
    </CustomProvider>
  );
}

export default App;
