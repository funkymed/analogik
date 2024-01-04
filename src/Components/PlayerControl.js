import { useEffect, useState } from "react";
import {
  IconButton,
  ButtonGroup,
  Panel,
  Slider,
  FlexboxGrid,
  Divider,
} from "rsuite";
import PauseIcon from "@rsuite/icons/legacy/Pause";
import PlayIcon from "@rsuite/icons/legacy/Play";
import StopIcon from "@rsuite/icons/legacy/Stop";
import { Capitalize } from "../utils";

function PlayerControl({
  player,
  isPlay,
  setIsPlay,
  volume,
  setVolume,
  togglePlay,
  currentTrack,
  meta,
  size,
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(isPlay);
  }, [isPlay, setIsPlay, playing]);

  return (
    <>
      <div style={{ width: 250, position: "absolute", bottom: 15, left: 15 }}>
        <label>Volume </label>
        <Slider
          progress={true}
          defaultValue={volume}
          value={volume}
          onChange={(value) => {
            setVolume(value);
          }}
        />
      </div>

      <div style={{ position: "absolute", top: 15, left: 15 }}>
        <ButtonGroup size="sm">
          {isPlay ? (
            <IconButton
              icon={<PauseIcon />}
              placement="left"
              onClick={() => togglePlay()}
            />
          ) : (
            <IconButton
              icon={<PlayIcon />}
              placement="left"
              onClick={() => togglePlay()}
            />
          )}

          <IconButton
            icon={<StopIcon />}
            placement="left"
            onClick={() => {
              player.seek(0);
              player.pause();
              setIsPlay(false);
            }}
          />
        </ButtonGroup>
      </div>

      <FlexboxGrid
        justify="space-around"
        align="middle"
        style={{
          display: "flex",
          height: window.innerHeight,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.89,
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FlexboxGrid.Item colspan={10}>
          <Panel
            shaded
            bordered
            style={{
              textAlign: "center",
              borderRadius: 20,
              backdropFilter: "blur(10px)",
              "-webkit-backdrop-filter": "blur(10px)",
              border: "2px solid rgba(255, 255, 255, 0.15)",
              fontFamily: "Kdam Thmor Pro",
              boxShadow: "0 10px 40px 0 rgba(0, 0, 0, 0.37)",
            }}
          >
            <h4
              style={{
                color: "#00BBFF",
                fontSize: 40,
                fontFamily: "Permanent Marker",
              }}
            >
              {meta.title ? meta.title : currentTrack.filename}
            </h4>
            <b
              style={{
                fontFamily: "Lobster",
                fontSize: 25,
                color: "#FF5555",
              }}
            >
              by{" "}
              {currentTrack.author.map(function (a, i, row) {
                let t = Capitalize(a);
                if (i + 1 !== row.length) {
                  t += " & ";
                }
                return t;
              })}{" "}
              in {currentTrack.year}
            </b>
            <br />
            <p>{size.toLocaleString()} octets</p>
            <br />
            <Divider>Message</Divider>
            <Panel
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: 150,
                overflowY: "overlay",
                pointerEvents: "auto",
                scrollbarColor: "red",
                fontSize: 15,
                color: "gray",
              }}
            >
              {meta.message}
            </Panel>
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  );
}

export default PlayerControl;
