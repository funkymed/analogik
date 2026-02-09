import { Container, Content, Whisper, Popover, FlexboxGrid } from "rsuite";
import authors from "./authors";
import { Capitalize } from "./utils";
import { useEffect, useRef } from "react";
import { isMobile } from "react-device-detect";

function ActivateAudio(props) {
  const authTxt = (a, c) => {
    let txt = Capitalize(a.nickname);
    if (c + 1 < authors.length) {
      txt += ", ";
    }

    const modulo = isMobile ? 5 : 10;
    const moduloFit = isMobile ? 0 : 6;

    return (
      <span key={`ath-${c}`} style={{ color: c % 2 === 0 ? "#DDD" : "#8AD" }}>
        {txt}
        {c % modulo === moduloFit ? <br /> : null}
      </span>
    );
  };
  const panel = useRef();

  useEffect(() => {
    const resizeHandler = () => {
      if (panel.current) {
        panel.current.style.width = `${window.innerWidth}px`;
        panel.current.style.height = `${window.innerHeight}px`;
      }
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <Container className="home-bg">
      <Content>
        <FlexboxGrid
          ref={panel}
          justify="center"
          align="middle"
          style={{
            height: window.innerHeight,
          }}
        >
          <FlexboxGrid>
            <FlexboxGrid.Item
              colspan={24}
              style={{ color: "#8AD", textAlign: "center" }}
            >
              <p>
                Click on the image bellow to enter
                <br /> the wonderfull world of the Analogik's Chiptunes.
              </p>
              <br />
              <Whisper
                // enterable
                placement="autoVertical"
                followCursor={true}
                speaker={<Popover title="Click me" />}
              >
                <img
                  className="home-img"
                  src="./logo512-cover.png"
                  alt="Analogik Music Disk - Click to enter"
                  onClick={props.unlockAudio}
                />
              </Whisper>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item
              colspan={24}
              style={{ color: "#F52", textAlign: "center", zIndex: 1 }}
            >
              <br />
              <p>
                Code by <span style={{ color: "#8AD" }}>Med</span>
              </p>
              <p>
                Musics by
                <br />
                {authors.map(authTxt)}
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
