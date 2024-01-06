import { Button } from "rsuite";

function YearList(props) {
  const color = 0 === props.year ? "primary" : "default";
  return (
    <>
      <h3>Years</h3>
      <Button appearance={color} size="xs" onClick={() => props.filterYear(0)}>
        All
      </Button>
      {props.years.map((_year) => {
        const color = _year === props.year ? "primary" : "default";
        return (
          <Button
            key={_year}
            appearance={color}
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
