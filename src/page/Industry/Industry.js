export default function Industry() {
  const data = [
    { name: "Energy", ifURL: false },
    { name: "Materials", ifURL: false },
    { name: "Industrials", ifURL: false },
    { name: "Utilities", ifURL: false },
    { name: "Healthcare", ifURL: false },
    { name: "Financials", ifURL: true },
    { name: "Consumer Discretionary", ifURL: false },
    { name: "Consumer Staples", ifURL: false },
    { name: "Information Technology", ifURL: false },
    { name: "Communication Services", ifURL: false },
    { name: "Real Estate", ifURL: false },
  ];
  return (
    <>
      <h2>Industry</h2>
      <ol className="breadcrumb">
        <li>
          <a href="#/">Home</a>
        </li>
        <li className="active">Industry</li>
      </ol>
      <p>
        According to GICS(Global Industry Classification Standard), there are 11
        sectors of industries. They are:
      </p>
      <p>
        <ul>
          {data.map(({ name, ifURL }, idx) => (
            <li key={idx}>
              {ifURL ? (
                <a href={`#/industry/${name.toLowerCase()}`}>{name}</a>
              ) : (
                name
              )}
            </li>
          ))}
        </ul>
      </p>
    </>
  );
}
