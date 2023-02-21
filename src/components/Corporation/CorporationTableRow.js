import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";

const DotAfter = styled.span`
  &::after {
    content: " ·";
  }
`;

const CardRow = ({ children, title }) => (
  <div
    title={title || ""}
    className="ps-1"
    data-toggle="tooltip"
    data-placement="top"
  >
    {children}
  </div>
);

function ParentRow({ path }) {
  const [isLoading, setIsLoading] = useState(true);
  const [parentData, setParentData] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchParentData() {
      try {
        const doc = await getDoc(path);
        // const data = doc.val();
        // console.log('doc', doc.data());
        setParentData(doc.data());
        setIsLoading(false);
      } catch (e) {
        setIsError(true);
        console.error(e);
      }
    }
    fetchParentData();
  }, [path]);

  if (isError) {
    console.error();
  }
  if (isLoading) return <>Loading ...</>;
  const { url, name } = parentData;
  return (
    <CardRow>
      <a href={url}>{name}</a>
    </CardRow>
  );
}

export function CorporationTableRow({
  name,
  url,
  candidatesNumber,
  jobsNumber,
  corporationNumber,
  memberNumber,
  revenue,
  description,
  parent,
  founded,
  idx,
}) {
  return (
    <tr>
      <td>{idx + 1}</td>
      <td>{url ? <a href={url}>{name}</a> : name}</td>
      <td>{founded && founded}</td>
      <td>
        {revenue &&
          new Intl.NumberFormat("en", {
            notation: "compact",
            style: "currency",
            currency: "USD",
          }).format(revenue)}
      </td>
      <td>
        {memberNumber &&
          new Intl.NumberFormat("en", {
            notation: "compact",
          }).format(memberNumber)}
      </td>
      <td>
        {candidatesNumber &&
          new Intl.NumberFormat("en", {
            notation: "compact",
          }).format(candidatesNumber)}
      </td>
      <td>
        {jobsNumber &&
          new Intl.NumberFormat("en", {
            notation: "compact",
          }).format(jobsNumber)}
      </td>
      <td>
        {corporationNumber &&
          new Intl.NumberFormat("en", {
            notation: "compact",
          }).format(corporationNumber)}
      </td>
      <td>{parent && <ParentRow path={parent} />}</td>
      <td>
        {description && (
          <div
            title="description"
            className="ps-1"
            data-toggle="tooltip"
            data-placement="top"
          >
            {description}
          </div>
        )}
      </td>
    </tr>
  );
}
