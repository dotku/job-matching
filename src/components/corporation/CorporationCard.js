import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

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
      parent: <a href={url}>{name}</a>
    </CardRow>
  );
}

export function CorporationCard({
  name,
  url,
  candidatesNumber,
  jobsNumber,
  corporationNumber,
  memberNumber,
  revenue,
  description,
  parent,
}) {
  return (
    <div className="col-sm-6 col-md-4 my-2">
      <div className="card">
        <div className="card-body">
          <div className="card-title h5">
            {url ? <a href={url}>{name}</a> : name}
          </div>
          <div className="card-text">
            {memberNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Members:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(memberNumber)}
              </div>
            )}
            {candidatesNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Candidates:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(candidatesNumber)}
              </div>
            )}
            {jobsNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Jobs:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(jobsNumber)}
              </div>
            )}
            {corporationNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Corporations:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(corporationNumber)}
              </div>
            )}
            {revenue && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Revenue:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                  style: "currency",
                  currency: "USD",
                }).format(revenue)}
              </div>
            )}
            {parent && <ParentRow path={parent} />}
            {description && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
