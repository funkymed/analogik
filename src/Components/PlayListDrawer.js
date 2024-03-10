import { Drawer, Radio, RadioGroup } from "rsuite";
import { mobileAndTabletCheck } from "../tools";
import TracksList from "../Components/TrackList";
import AuthorList from "../Components/AuthorList";
import YearList from "../Components/YearList";

function PlaylistDrawer(props) {
  return (
    <Drawer
      size={mobileAndTabletCheck() ? "full" : "lg"}
      placement="right"
      open={props.open}
      onClose={() => props.setOpen(false)}
    >
      <Drawer.Header>
        <Drawer.Title>Finally the Analogik's MusicDisk</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>
        <h3>Selection</h3>
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
