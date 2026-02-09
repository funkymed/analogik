import Drawer from "rsuite/Drawer";
import FlexboxGrid from "rsuite/FlexboxGrid";
import Whisper from "rsuite/Whisper";
import Popover from "rsuite/Popover";
import Button from "rsuite/Button";
import authors from "../authors";
import { useEffect, useState } from "react";
import { getTracksByAuthor, getTracksCoop } from "../tracks";
import { Capitalize } from "../utils";
import { isMobile } from "react-device-detect";

function AboutDrawer(props) {
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    const ct = [];
    authors.map((author) => {
      if (
        author.country &&
        author.country !== "?" &&
        ct.indexOf(author.country) === -1
      ) {
        ct.push(author.country);
      }
      ct.sort();
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
      size={isMobile ? "full" : "lg"}
      placement="right"
      open={props.aboutOpen}
      //   open={true}
      onClose={() => props.setAboutOpen(false)}
      // backdrop={false}
    >
      <Drawer.Header>
        <Drawer.Title>About Analogik and the MusicDisk</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body style={{ fontSize: 18 }} className="about">
        <p>
          <u>Analogik</u> stood as a beacon in the realm of Chiptune, a label
          where every artist was a luminary within the vibrant Demoscene of the
          2000s.
        </p>

        <p>
          Conceived by the visionary minds of <b>Kenët</b> and <b>Med</b> in
          2000, <u>Analogik</u> was born from a simple yet audacious mission: to
          craft miniature masterpieces brimming with unparalleled composition
          and sonic brilliance.
        </p>

        <p>
          Among the founding members, <b>Nagz</b> shone brightly, contributing
          significantly to the label's ethos and churning out a plethora of
          tracks throughout its illustrious three-year tenure.
        </p>

        <p>
          Over the course of those three years, <u>Analogik</u> served as a
          melting pot of musical talent, attracting 27 artists from across the
          globe, representing {countries.length} countries. Together, they
          delved into an eclectic array of genres, spanning from jazz to
          chiptune, from hip-hop to funk, and from acid jazz to dark ambient and
          trip-hop. These musical marvels were meticulously composed using
          Impulse Tracker, ScreamTracker 3, and Fasttracker 2, with file sizes
          always kept under 80ko, often resting comfortably below 20ko.
        </p>

        <p>
          Hailing from diverse corners of the world : {countries.join(", ")}.
          The artists united under <u>Analogik</u>'s banner, forming a global
          symphony of creativity and collaboration.
        </p>

        <p>
          In the era before social media dominance, communication flourished
          through the digital underground of IRC channels, where artists
          connected and forged lasting bonds.
        </p>
        <p>
          Coded by Med in 2024 with the support of <b>Nagz</b>, <i>Willbe</i>,{" "}
          <u>Bacter</u>, <b>Unware</b> and <i>Ks</i>, this Music Disk is a gift
          for all the Chiptune's lovers to never forgot what was Analogik.
        </p>
        <p>All artists who participated :</p>

        <FlexboxGrid style={{ fontSize: 16 }}>
          {authors.map((author, k) => {
            return (
              <Whisper
                key={`whishper-author-${k}`}
                enterable
                placement="top"
                // followCursor={true}
                speaker={
                  <Popover title={author.name}>
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
              >
                <Button
                  key={`button-author-${k}`}
                  appearance="subtle"
                  className="btn-glass"
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
                  <div>
                    {Capitalize(author.nickname)}
                    <br />
                    <span className="guest">{author.country || ""}</span>
                    <br />
                    {author.member ? (
                      <>&nbsp;</>
                    ) : (
                      <span className="guest">Guest</span>
                    )}
                  </div>
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
