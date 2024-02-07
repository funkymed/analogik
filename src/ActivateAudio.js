import { Whisper, Popover, FlexboxGrid } from "rsuite";

function ActivateAudio(props) {
  return (
    <FlexboxGrid
      justify="center"
      align="middle"
      style={{
        height: window.innerHeight,
        background: "#212224",
      }}
    >
      <Whisper
        enterable
        placement="auto"
        trigger="hover"
        speaker={
          <Popover title="Click me !">
            To enter the magical world of
            <br />
            Analogik the Chiptune netlabel.
          </Popover>
        }
      >
        <img
          src="./images/analogik.jpg"
          height="512"
          onClick={props.unlockAudio}
          style={{
            filter: "drop-shadow(0px 0px 25px #000000AA)",
            cursor: "pointer",
          }}
        />
      </Whisper>
    </FlexboxGrid>
  );
}

export default ActivateAudio;
