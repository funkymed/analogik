import { Button } from "rsuite";

function AuthorList(props) {
  const color = 0 === props.author ? "primary" : "default"; 
  return (
    <>
      <h3>Authors ({props.authors.length})</h3>

      <Button
        appearance={color}
        size="xs"
        onClick={() => props.filterAuthor(0)}
      >
        All
      </Button>
      {props.authors.map(function (_author) {
        const color = _author === props.author ? "primary" : "default";
        return (
          <Button
            key={_author}
            appearance={color}
            onClick={() => props.filterAuthor(_author)}
            size="xs"
          >
            {_author}
          </Button>
        );
      })}
    </>
  );
}

export default AuthorList;
