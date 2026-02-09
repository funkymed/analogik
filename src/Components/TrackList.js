import Button from "rsuite/Button";
function TracksList(props) {
  return (
    <>
      <h3>Tracks ({props.mods.length})</h3>
      {props.mods.map(function (a, b) {
        return (
          <Button
            className={
              props.currentTrack.filename === `${a.filename}`
                ? "btn-glass selected"
                : "btn-glass"
            }
            key={`track-${b}`}
            onClick={() => props.load(a)}
            size="sm"
          >{a.pos}. {`${a.author.join(" & ")} : ${a.filename} (${a.year})`}</Button>
        );
      })}
    </>
  );
}

export default TracksList;
