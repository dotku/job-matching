import { paramCase } from "param-case";
import { NAICS } from "./data";

export default function Industry() {
  const GICSData = [
    { name: "Energy", ifURL: false },
    { name: "Materials", ifURL: false },
    { name: "Industrials", ifURL: false },
    { name: "Utilities", ifURL: false },
    { name: "Healthcare", ifURL: false },
    { name: "Financials", ifURL: true },
    { name: "Consumer Discretionary", ifURL: false },
    { name: "Consumer Staples", ifURL: false },
    { name: "Information Technology", ifURL: true },
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
        According to{" "}
        <a href="https://www.msci.com/our-solutions/indexes/gics">GICS</a>{" "}
        (Global Industry Classification Standard), there are 11 sectors of
        industries, 25 Industry groups, 74 industries and 163 sub-industries.
        They are:
      </p>

      <ol>
        {GICSData.map(({ name, ifURL }, idx) => (
          <li key={idx}>
            {ifURL ? (
              <a href={`#/industry/${paramCase(name)}`}>{name}</a>
            ) : (
              name
            )}
          </li>
        ))}
      </ol>

      <p>
        But according to <a href="https://www.census.gov/naics/">NAICS</a>{" "}
        (North American Industry Classification System), it woiuld be 20
        sectors:
      </p>

      <ol>
        {NAICS[2022].map(({ define }, idx) => (
          <li key={idx}>{define}</li>
        ))}
      </ol>

      <p>
        Since we don't have large industry data, let's focuse on GICS for now.
      </p>
    </>
  );
}
