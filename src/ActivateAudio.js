import {
  Container,
  Content,
  Whisper,
  Popover,
  FlexboxGrid,
  Panel,
} from "rsuite";

function ActivateAudio(props) {
  return (
    <Container>
      <Content>
        <FlexboxGrid
          justify="center"
          align="middle"
          style={{
            height: window.innerHeight,
            background: "#212224",
          }}
        >
          <FlexboxGrid>
            <FlexboxGrid.Item colspan={24} style={{ textAlign: "center" }}>
              <Whisper
                enterable
                placement="autoVertical"
                followCursor={true}
                speaker={<Popover title="Click me" />}
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
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={24} style={{ textAlign: "center" }}>
              <br />
              <br />
              <br />
              Click on the image bellow to enter
              <br /> the wonderfull world of the Analogik's Chiptune.
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </FlexboxGrid>
      </Content>
    </Container>
  );
}

export default ActivateAudio;
