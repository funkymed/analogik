import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, ButtonGroup, Slider, FlexboxGrid } from "rsuite";
import PauseIcon from "@rsuite/icons/legacy/Pause";
import NextIcon from "@rsuite/icons/legacy/PageNext";
import PrevIcon from "@rsuite/icons/legacy/PagePrevious";
import PlayIcon from "@rsuite/icons/legacy/Play";
import StopIcon from "@rsuite/icons/legacy/Stop";
import { Capitalize } from "../utils";
import TWEEN from "@tweenjs/tween.js";
import useKeypress from "react-use-keypress";
import { isMobile } from "react-device-detect";

let tweenAnim;

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
  isNextTrack,
  isPrevTrack,
  nextTrack,
  prevTrack,
  lengthTracks,
  isMouseMoving,
  isLoading,
}) {
  const [playing, setPlaying] = useState(false);

  const FlexContent = useRef();
  const titlePanel = useRef();
  const bottomTitle = useRef();
  const topTitle = useRef();

  const handleResize = useCallback(() => {
    if (FlexContent.current) {
      FlexContent.current.style.height = `${window.innerHeight}px`;
    }
  }, []);

  useEffect(() => {
    setPlaying(isPlay);
  }, [isPlay, setIsPlay, playing]);

  useEffect(() => {
    if (isLoading) {
      if (bottomTitle.current) {
        bottomTitle.current.style.opacity = 0;
      }
      if (titlePanel.current) {
        titlePanel.current.style.opacity = 0;
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (tweenAnim) TWEEN.remove(tweenAnim);

    if (bottomTitle.current) {
      bottomTitle.current.style.opacity = 0;
    }
    if (titlePanel.current && isPlay) {
      if (isMobile) {
        titlePanel.current.style.display = "none";
      }
      titlePanel.current.style.opacity = 0;
      const timeAnim = 250;
      tweenAnim = new TWEEN.Tween(titlePanel.current.style)
        .to({ opacity: 1 }, timeAnim)
        .delay(2000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onComplete(() => {
          tweenAnim = new TWEEN.Tween(titlePanel.current.style)
            .to({ opacity: 0 }, timeAnim)
            .delay(2000)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onComplete(() => {
              tweenAnim = new TWEEN.Tween(bottomTitle.current.style)
                .to({ opacity: 0.85 }, timeAnim / 2)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();
            })
            .start();
        })
        .start();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [meta, isPlay]);

  const getTitle = () => {
    return (
      `${currentTrack.pos}. ` +
      String(meta.title ? meta.title : currentTrack.filename).toUpperCase()
    );
  };
  const getAuthors = () => {
    const a = currentTrack.author;
    const authors = [];
    for (let c in a) {
      authors.push(Capitalize(a[c]));
    }

    return authors.join(" & ");
  };

  const getOctets = (n) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  useKeypress(" ", togglePlay);
  useKeypress("ArrowLeft", prevTrack);
  useKeypress("ArrowRight", nextTrack);
  useKeypress("ArrowUp", () => {
    const newVolume = volume + 5;
    setVolume(newVolume <= 100 ? newVolume : 100);
  });
  useKeypress("ArrowDown", () => {
    const newVolume = volume - 5;
    setVolume(newVolume > 0 ? newVolume : 0);
  });

  return (
    <>
      {!isMobile ? (
        <div
          style={{ width: 100, position: "absolute", bottom: 15, left: 15 }}
          className={!isMouseMoving ? "hide" : ""}
        >
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
        ref={bottomTitle}
        style={{
          width: window.innerWidth,
          position: "absolute",
          fontFamily: "Kdam Thmor Pro",
          bottom: 15,
          left: 0,
          opacity: 0,
          textAlign: "center",
          filter: "drop-shadow(0px 0px 5px #000000FF)",
          fontSize: 15,
          color: "#FFF",
          pointerEvents: "none",
        }}
      >
        {isMobile ? (
          <>
            <b>{getTitle()}</b> by {getAuthors()} <br />
            in {currentTrack.year} <br />
            {getOctets(size)} octets
          </>
        ) : (
          <>
            <b>{getTitle()}</b> by {getAuthors()} in {currentTrack.year} (
            {getOctets(size)} octets)
          </>
        )}
      </div>

      {!isMobile ? (
        <div
          ref={topTitle}
          className={!isMouseMoving ? "hide" : ""}
          style={{
            width: window.innerWidth,
            position: "absolute",
            fontFamily: "Kdam Thmor Pro",
            top: 15,
            left: 0,
            textAlign: "center",
            filter: "drop-shadow(0px 0px 5px #000000FF)",
            fontSize: 15,
            color: "#FFF",
            pointerEvents: "none",
          }}
        >
          Change track <b>← →</b> - Volume <b>↑ ↓</b> - use keyboard to display
          information <b>(i)</b> and playlist <b>(p)</b>
        </div>
      ) : (
        ""
      )}

      <div
        style={{ position: "absolute", top: 15, left: 15 }}
        className={!isMouseMoving ? "hide" : ""}
      >
        <ButtonGroup
          size="sm"
          style={{
            filter: "drop-shadow(0px 1px 18px #000000)",
          }}
        >
          <IconButton
            icon={<PrevIcon />}
            placement="left"
            disabled={!isPrevTrack}
            onClick={prevTrack}
          />
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

          <IconButton
            icon={<NextIcon />}
            placement="left"
            disabled={!isNextTrack}
            onClick={nextTrack}
          />
        </ButtonGroup>
        <br />
        <div style={{ textAlign: "center" }}>
          {currentTrack.pos} / {lengthTracks}
        </div>
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
            ref={titlePanel}
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
            </div>
          </div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  );
}

export default PlayerControl;
