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
      {props.authors.map((author) => {
        return (
          <Button
            className={
              author === props.author ? "btn-glass selected" : "btn-glass"
            }
            key={author}
            onClick={() => {
              props.filterAuthor(author);
            }}
            size="sm"
          >
            {author}
          </Button>
        );
      })}
    </>
  );
}

export default AuthorList;
