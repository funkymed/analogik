import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, ButtonGroup, Slider, FlexboxGrid } from "rsuite";
import PauseIcon from "@rsuite/icons/legacy/Pause";
import PlayIcon from "@rsuite/icons/legacy/Play";
import StopIcon from "@rsuite/icons/legacy/Stop";
import { Capitalize } from "../utils";
import BackdropFilter from "react-backdrop-filter";

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
  const FlexContent = useRef();

  const handleResize = useCallback(() => {
    if (FlexContent.current) {
      FlexContent.current.style.height = `${window.innerHeight}px`;
    }
  }, []);

  useEffect(() => {
    setPlaying(isPlay);
  }, [isPlay, setIsPlay, playing]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
        <ButtonGroup
          size="sm"
          style={{
            filter: "drop-shadow(0px 1px 18px #000000)",
          }}
        >
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
        ref={FlexContent}
        style={{
          display: "flex",
          height: window.innerHeight,
          pointerEvents: "none",
        }}
      >
        <FlexboxGrid.Item colspan={10}>
          <BackdropFilter
            filter={"blur(16px) brightness(120%)"}
            canvasFallback={true}
            html2canvasOpts={{
              allowTaint: true,
            }}
          >
            <div
              style={{
                background: "rgba(64, 64, 64, 0.15)",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                fontFamily: "Kdam Thmor Pro",
                textAlign: "center",
                padding: 20,
                height: 320,
                // borderRadius: 20,
              }}
            >
              <h4
                style={{
                  color: "#00BBFF",
                  fontSize: 40,
                  fontFamily: "Permanent Marker",
                  filter: "drop-shadow(0px 0px 20px #000000)",
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
              {meta.message ? (
                <>
                  <hr
                    style={{
                      border: "1px white solid",
                      opacity: 0.1,
                    }}
                  />
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      maxHeight: 150,
                      overflowY: "overlay",
                      pointerEvents: "auto",
                      scrollbarColor: "red",
                      fontSize: 15,
                      color: "black",
                    }}
                  >
                    {meta.message}
                  </div>
                </>
              ) : (
                ""
              )}
            </div>
          </BackdropFilter>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  );
}

export default PlayerControl;
