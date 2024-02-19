import { Button } from "rsuite";

function AuthorList(props) {
  return (
    <>
      <h3>Authors ({props.authors.length})</h3>
      <Button
        className={0 === props.author ? "btn-glass selected" : "btn-glass"}
        // appearance={color}
        size="xs"
        onClick={() => props.filterAuthor(0)}
      >
        ALL
      </Button>
      {props.authors.map((_author) => {
        return (
          <Button
            className={
              _author === props.author ? "btn-glass selected" : "btn-glass"
            }
            key={_author}
            onClick={() => props.filterAuthor(_author)}
            size="sm"
          >
            {_author}
          </Button>
        );
      })}
    </>
  );
}

export default AuthorList;
