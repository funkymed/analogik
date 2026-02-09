import Button from "rsuite/Button";
function TracksList(props) {
  return (
    <>
      <h3>Tracks ({props.mods.length})</h3>
      {props.mods.map((track) => {
        return (
          <Button
            className={
              props.currentTrack.filename === `${track.filename}`
                ? "btn-glass selected"
                : "btn-glass"
            }
            key={`${track.year}-${track.filename}`}
            onClick={() => props.load(track)}
            size="sm"
          >{track.pos}. {`${track.author.join(" & ")} : ${track.filename} (${track.year})`}</Button>
        );
      })}
    </>
  );
}

export default TracksList;
