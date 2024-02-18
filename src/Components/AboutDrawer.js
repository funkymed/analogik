import { Drawer, FlexboxGrid, Whisper, Popover, Button } from "rsuite";
import authors from "../authors";
import { useEffect, useState } from "react";
import { getTracksByAuthor, getTracksCoop } from "../tracks";
import { Capitalize } from "../utils";
import { mobileAndTabletCheck } from "../tools";

function AboutDrawer(props) {
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    const ct = [];
    authors.map((author) => {
      if (author.country && ct.indexOf(author.country) === -1) {
        ct.push(author.country);
      }
      setCountries(ct);
    });
  }, []);

  const getMessageTrack = (author) => {
    const authorTracks = getTracksByAuthor(author);
    if (authorTracks.length > 0) {
      return (
        <>
          {authorTracks.length} track{authorTracks.length > 1 ? "s" : ""}
          <br />
        </>
      );
    } else {
      return "";
    }
  };

  const getMessageCoop = (author) => {
    const authorCoops = getTracksCoop(author);
    if (authorCoops > 0) {
      return (
        <>
          {authorCoops} coop{authorCoops > 1 ? "s" : ""}
          <br />
        </>
      );
    } else {
      return "";
    }
  };

  return (
    <Drawer
      size={mobileAndTabletCheck() ? "full" : "lg"}
      placement="right"
      open={props.aboutOpen}
      //   open={true}
      onClose={() => props.setAboutOpen(false)}
        backdrop={false}
    >
      <Drawer.Header>
        <Drawer.Title>About Analogik</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body style={{ fontSize: 18 }}>
        <p>
          Analogik was a Chiptune label. All the artists were part of the
          Demoscene in the 2000's.
        </p>
        <br />
        <p>
          Founded by <b>Kenët</b> and <b>Med</b> in 2000 on a simple idea : Make
          tiny tracks with great composition and sound.
        </p>
        <br />
        <p>
          <b>Nagz</b> was one of the very first member, he was part of the main
          idea and produced a lots of tracks during the 3 years of the label
          existence.
        </p>
        <br />
        <p>
          During 3 years 27 artists from all over the worlds ({countries.length}{" "}
          countries) produced hundred tracks in differents style like jazz,
          chiptune, hiphop, funk, acidjazz, dark ambient, triphop ...
          <br />
          The track were composed on Impulse Tracker, ScreamTracker 3 and
          Fasttracker 2. The modules were always under 80ko, but mainly less
          than 20ko.
        </p>
        <br />
        <p>
          All the artists came from those countries : {countries.join(", ")}.
        </p>
        <br />
        <p>We used IRC back in the days to contacts each others.</p>
        <br />
        <p>All the Artists who particapted :</p>
        <br />

        <FlexboxGrid style={{ fontSize: 16 }}>
          {authors.map((author, k) => {
            return (
              <Whisper
                placement="auto"
                key={`whishper-author-${k}`}
                trigger="hover"
                speaker={
                  <Popover title={author.name}>
                    {author.country || ""}
                    <br />
                    {author.member ? "Member" : "Guest"}
                    <br />
                    {getMessageTrack(author.nickname)}
                    {getMessageCoop(author.nickname)}
                    {author.url ? (
                      <a href={author.url} target="_blank">
                        {author.url}
                      </a>
                    ) : (
                      ""
                    )}
                  </Popover>
                }
                enterable
              >
                <Button
                  key={`button-author-${k}`}
                  appearance="ghost"
                  onClick={() => {
                    props.filterAuthor(author.nickname, true);
                    props.setAboutOpen(false);
                    props.setTrackDrawerOpen(true);
                  }}
                  style={{
                    display: "inline-block",
                    width: 128,
                    height: 128,
                    padding: 10,
                  }}
                >
                  <div>{Capitalize(author.nickname)}</div>
                </Button>
              </Whisper>
            );
          })}
        </FlexboxGrid>
      </Drawer.Body>
    </Drawer>
  );
}

export default AboutDrawer;
