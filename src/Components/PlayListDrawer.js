import Col from "rsuite/Col";
import Drawer from "rsuite/Drawer";
import Grid from "rsuite/Grid";
import Radio from "rsuite/Radio";
import RadioGroup from "rsuite/RadioGroup";
import Row from "rsuite/Row";
import Button from "rsuite/Button";
import TracksList from "../Components/TrackList";
import AuthorList from "../Components/AuthorList";
import YearList from "../Components/YearList";
import MinusIcon from "@rsuite/icons/legacy/Minus";
import PlusIcon from "@rsuite/icons/legacy/Plus";
import { isMobile } from "react-device-detect";

function PlaylistDrawer(props) {
  return (
    <Drawer
      size={isMobile ? "full" : "lg"}
      placement="right"
      open={props.open}
      onClose={() => props.setOpen(false)}
    >
      <Drawer.Header>
        <Drawer.Title>Finally the Analogik's MusicDisk</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>
        <h3>Selection</h3>
        <Grid>
          <Row>
            <Col xs={6} xsPush={16}>
              {props.isCustomPlaylist ? (
                <Button
                  className="btn-glass selected"
                  onClick={() => {
                    props.PlayListControl(true);
                  }}
                >
                  <MinusIcon />
                  &nbsp;&nbsp; Clear your playlist
                </Button>
              ) : (
                <Button
                  className="btn-glass"
                  onClick={() => {
                    props.PlayListControl();
                  }}
                >
                  <PlusIcon />
                  &nbsp;&nbsp;Make filters as Playlist
                </Button>
              )}
            </Col>
            <Col xs={6} xsPull={6}>
              <RadioGroup
                inline
                appearance="picker"
                defaultValue="all"
                value={props.selection}
                onChange={props.filterSelection}
              >
                <Radio value="all">All</Radio>
                <Radio value="selecta">Selecta</Radio>
                <Radio value="bleep">Bleep</Radio>
              </RadioGroup>
            </Col>
          </Row>
        </Grid>

        <div style={{ marginTop: 25 }}>
          <YearList
            year={props.year}
            years={props.years}
            filterYear={props.filterYear}
          />
        </div>
        <div style={{ marginTop: 25 }}>
          <AuthorList
            author={props.author}
            authors={props.authors}
            filterAuthor={props.filterAuthor}
          />
        </div>
        <div style={{ marginTop: 25 }}>
          <TracksList
            mods={props.mods}
            currentTrack={props.currentTrack}
            load={props.setCurrentTrack}
          />
        </div>
      </Drawer.Body>
    </Drawer>
  );
}

export default PlaylistDrawer;
