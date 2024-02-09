import { Container, Content, Whisper, Popover, FlexboxGrid } from "rsuite";
import authors from "./authors";
import { Capitalize } from "./utils";

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
                  onClick={props.unlockAudio}
                  style={{
                    height: "512px",
                    filter: "drop-shadow(0px 0px 25px #000000AA)",
                    cursor: "pointer",
                  }}
                />
              </Whisper>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={24} style={{ textAlign: "center" }}>
              <br />
              <p>
                Click on the image bellow to enter
                <br /> the wonderfull world of the Analogik's Chiptune.
              </p>
              <br />
              <p>Code by Med</p>
              <p>
                Musics by
                <br />
                {authors.map((a, c) => {
                  return (
                    Capitalize(a.nickname) +
                    (c + 1 < authors.length ? ", " : "")
                  );
                })}{" "}
              </p>
              <br />
              <p>Analogik 2000 - 2002</p>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </FlexboxGrid>
      </Content>
    </Container>
  );
}

export default ActivateAudio;
