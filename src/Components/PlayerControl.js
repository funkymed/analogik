import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, ButtonGroup, Slider, FlexboxGrid } from "rsuite";
import PauseIcon from "@rsuite/icons/legacy/Pause";
import PlayIcon from "@rsuite/icons/legacy/Play";
import StopIcon from "@rsuite/icons/legacy/Stop";
import { Capitalize } from "../utils";
import { mobileAndTabletCheck } from "../tools";

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

  const getTitle = () => {
    return (meta.title ? meta.title : currentTrack.filename).toUpperCase();
  };
  const getAuthors = () => {
    const a = currentTrack.author;

    for (let c in a) {
      a[c] = Capitalize(a[c]);
    }

    return a.join(" & ");
  };

  const getOctets = (n) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <>
      {!mobileAndTabletCheck() ? (
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
      ) : (
        ""
      )}

      <div
        style={{
          width: window.innerWidth,
          position: "absolute",
          fontFamily: "Kdam Thmor Pro",
          bottom: 15,
          left: 0,
          opacity: 0.85,
          textAlign: "center",
          filter: "drop-shadow(0px 0px 5px #000000FF)",
          fontSize: 15,
          color: "#FFF",
          pointerEvents: "none",
        }}
      >
        <b>{getTitle()}</b> by {getAuthors()} in {currentTrack.year} (
        {getOctets(size)} octets)
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
        // justify="space-around"
        align="middle"
        ref={FlexContent}
        style={{
          display: "flex",
          height: window.innerHeight,
          pointerEvents: "none",
        }}
      >
        <FlexboxGrid.Item colspan={10} style={{ pointerEvents: "none" }}>
          <div
            className="fade-in"
            style={{
              opacity: 0,
              width: window.innerWidth,
              backdropFilter: "blur(16px) brightness(120%)",
              filter: "drop-shadow(0px 0px 5px #FFFFFF88)",
              border: "5px solid rgba(255, 255, 255, 0.15)",
              borderLeft: "none",
              borderRight: "none",
              background: "rgba(255,255,255, 0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "Kdam Thmor Pro",
                textAlign: "center",
                margin: 50,
                padding: 20,
                pointerEvents: "none",
              }}
            >
              <h4
                style={{
                  color: "#000",
                  fontSize: 40,
                  fontFamily: "Permanent Marker",
                  filter: "drop-shadow(0px 0px 5px #17467aAA)",
                }}
              >
                {getTitle()}
              </h4>
              <b
                style={{
                  fontFamily: "Lobster",
                  fontSize: 25,
                  color: "#555555",
                  filter: "drop-shadow(0px 0px 5px #FFFFFF88)",
                  fontStyle: "italic",
                }}
              >
                by {getAuthors()} in {currentTrack.year}
              </b>
              <br />
              <p
                style={{
                  color: "#333",
                  filter: "drop-shadow(0px 0px 2px #000000EE)",
                }}
              >
                {getOctets(size)} octets
              </p>
              {/* {meta.message ? (
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
              )} */}
            </div>
          </div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  );
}

export default PlayerControl;
