import { paramCase } from "param-case";
import { NAICS, GICSData } from "./data";
import styled from "styled-components";

const ListWrapper = styled.div`
  & ol {
    counter-reset: item;
    list-style: none;
  }
  & li:before {
    counter-increment: item;
    content: counters(item, ".") ". ";
  }
`;

export default function Industry() {
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
      <ListWrapper>
        <ol>
          {GICSData.map((item, idx) => (
            <li key={idx}>
              {item.ifURL ? (
                <a href={`#/industry/${paramCase(item["Sector Name"])}`}>
                  {item["Sector Name"]}
                </a>
              ) : (
                item["Sector Name"]
              )}
              <ol>
                {item["Industry Groups"]?.length &&
                  item["Industry Groups"].map(
                    (group, gidx) => (
                      <li key={gidx}>{group["Industry Group Name"]}</li>
                    )
                    // <a
                    //   key={idx}
                    //   href={`#/industry/${paramCase(
                    //     group["Industry Groups Name"]
                    //   )}`}
                    // >
                    //   {group["Industry Groups Name"]}
                    // </a>
                  )}
              </ol>
            </li>
          ))}
        </ol>
      </ListWrapper>

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
