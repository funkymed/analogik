import { Container, Content, Whisper, Popover, FlexboxGrid } from "rsuite";
import authors from "./authors";
import { Capitalize } from "./utils";
import { mobileCheck } from "./tools";

function ActivateAudio(props) {
  const authTxt = (a, c) => {
    let txt = Capitalize(a.nickname);
    if (c + 1 < authors.length) {
      txt += ", ";
    }

    const modulo = mobileCheck() ? 5 : 10;

    return (
      <span key={`ath-${c}`}>
        {txt}
        {c % modulo === 0 ? <br /> : ""}
      </span>
    );
  };

  return (
    <Container style={{ background: "#212224" }}>
      <Content
        style={{
          height: window.innerHeight,
          margin: 10,
        }}
      >
        <FlexboxGrid justify="center" align="middle">
          <FlexboxGrid>
            <FlexboxGrid.Item colspan={24} style={{ textAlign: "center" }}>
              <p>
                Click on the image bellow to enter
                <br /> the wonderfull world of the Analogik's Chiptune.
              </p>
              <br />
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
              <p>Code by Med</p>
              <p>
                Musics by
                <br />
                {authors.map(authTxt)}
              </p>
              <p>Analogik 2000 - 2002</p>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </FlexboxGrid>
      </Content>
    </Container>
  );
}

export default ActivateAudio;
