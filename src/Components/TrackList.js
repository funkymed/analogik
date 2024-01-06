import { Button } from "rsuite";
function TracksList(props) {
  return (
    <>
      <h2>Tracks ({props.mods.length})</h2>
      {props.mods.map(function (a, b) {
        const color =
          props.currentTrack.filename === `${a.filename}`
            ? "primary"
            : "default";
        return (
          <Button
            key={`track-${b}`}
            onClick={() => props.load(a)}
            appearance={color}
            size="sm"
          >{`${a.author.join(" & ")} : ${a.filename} (${a.year})`}</Button>
        );
      })}
    </>
  );
}

export default TracksList;
