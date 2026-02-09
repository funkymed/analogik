import Button from "rsuite/Button";

function YearList(props) {
  return (
    <>
      <h3>Years</h3>
      <Button
        className={0 === props.year ? "btn-glass selected" : "btn-glass"}
        size="xs"
        onClick={() => props.filterYear(0)}
      >
        ALL
      </Button>
      {props.years.map((_year) => {
        return (
          <Button
            className={
              _year === props.year ? "btn-glass selected" : "btn-glass"
            }
            key={_year}
            onClick={() => props.filterYear(_year)}
            size="sm"
          >
            {_year}
          </Button>
        );
      })}
    </>
  );
}

export default YearList;
