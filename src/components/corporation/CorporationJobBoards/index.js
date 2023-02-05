import React, { useEffect, useState } from "react";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { CorporationTags, firebaseConfig } from "../CorporationConfig";
import WithErrorContent from "../../common/WithErrorContent";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(firebaseConfig, "app-corporation");
export const corporationDB = getFirestore(app);
export const corporationRef = collection(corporationDB, "corporation");

export function JobBoards(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobBoards, setJobBoards] = useState([]);
  const { phrase } = props;

  useEffect(() => {
    async function effectQuery() {
      const newJobBoards = [];

      try {
        const querySnapshot = await getDocs(corporationRef);

        querySnapshot.forEach((doc) => {
          const { tags } = doc.data();

          if (!tags) return;

          if (
            Array.isArray(tags) &&
            tags.includes(CorporationTags.CANDIDATE_POOL) &&
            tags.includes(CorporationTags.RECRUITING_SAAS)
          )
            newJobBoards.push(doc.data());

          if (
            tags[CorporationTags.JOB_BOARD] ||
            (tags[CorporationTags.CANDIDATE_POOL] &&
              (tags[CorporationTags.RECRUITING_SAAS] ||
                tags[CorporationTags.RECRUITING]))
          )
            newJobBoards.push(doc.data());
        });
      } catch (e) {
        console.error(e);
        setError(e);
      }
      setJobBoards(newJobBoards);
      setIsLoading(false);
    }
    effectQuery();
  }, []);

  const results = jobBoards
    .filter((board) =>
      phrase ? board.name.match(new RegExp(phrase, "i")) : true
    )
    .map(
      (
        {
          name,
          url,
          candidatesNumber,
          jobsNumber,
          corporationNumber,
          memberNumber,
          revenue,
        },
        key
      ) => (
        <div className="col-sm-6 col-md-4 my-2" key={key}>
          <div className="card">
            <div className="card-body">
              <div className="card-title h5">
                {url ? <a href={url}>{name}</a> : { name }}
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
              </div>
            </div>
          </div>
        </div>
      )
    );

  return (
    <div>
      <h2>Job Boards</h2>
      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <WithErrorContent error={error}>
          <div className="row my-3">
            {results.length ? results : "empty content"}
          </div>
        </WithErrorContent>
      )}
    </div>
  );
}
