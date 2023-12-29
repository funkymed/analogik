import { useState } from "react";
import {
  IconButton,
  Progress,
  ButtonGroup,
  Panel,
  Slider,
  FlexboxGrid,
  Divider,
} from "rsuite";
import PauseIcon from "@rsuite/icons/legacy/Pause";
import PlayIcon from "@rsuite/icons/legacy/Play";
import StopIcon from "@rsuite/icons/legacy/Stop";
import { useInterval } from "usehooks-ts";
import { Capitalize } from "../utils";

function PlayerControl(props) {
  const [progress, setProgress] = useState(0);

  useInterval(
    () => {
      setProgress((props.player.getPosition() / props.player.duration()) * 100);
      if (props.player.getPosition() === 0 && props.player.duration() === 0) {
        props.setIsPlay(false);
        /*if (repeat) {
            //playMusic(trackId);
          } else {
            //playNext();
          }*/
      }
    },
    // Delay in milliseconds or null to stop it
    props.isPlay ? 300 : null
  );

  return (
    <>
      <div style={{ width: 250, position: "absolute", bottom: 15, left: 15 }}>
        <label>Volume </label>
        <Slider
          progress
          defaultValue={props.volume}
          onChange={(value) => {
            props.setVolume(value);
          }}
        />
      </div>

      <div style={{ position: "absolute", top: 15, left: 15 }}>
        <ButtonGroup size="sm">
          {props.isPlay ? (
            <IconButton
              icon={<PauseIcon />}
              placement="left"
              onClick={() => props.togglePlay()}
            />
          ) : (
            <IconButton
              icon={<PlayIcon />}
              placement="left"
              onClick={() => props.togglePlay()}
            />
          )}

          <IconButton
            icon={<StopIcon />}
            placement="left"
            onClick={() => {
              props.player.seek(0);
              props.player.pause();
              props.setIsPlay(false);
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
        }}
      >
        <FlexboxGrid.Item colspan={12}>
          <Panel
            shaded
            bordered
            style={{
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "red" }}>
              {props.meta.title
                ? props.meta.title
                : props.currentTrack.filename}
            </h4>
            <b>
              by{" "}
              {props.currentTrack.author.map(function (a, i, row) {
                let t = Capitalize(a);
                if (i + 1 !== row.length) {
                  t += " & ";
                }
                return t;
              })}{" "} in {props.currentTrack.year}
            </b>
            <br />
            <p>{props.size.toLocaleString()} octets</p>
            <br />
            <Progress.Line
              percent={progress}
              strokeColor="red"
              showInfo={false}
            />
            <Divider>Message</Divider>
            <Panel
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: 110,
                overflowY: "overlay",
                scrollbarColor: "red",
              }}
            >
              {props.meta.message}
            </Panel>
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  );
}

export default PlayerControl;
