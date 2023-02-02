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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function JobBoards(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobBoards, setJobBoards] = useState([]);
  const { phrase } = props;

  useEffect(() => {
    async function effectQuery() {
      const newJobBoards = [];
      const corporationRef = collection(db, "corporation");
      try {
        const querySnapshot = await getDocs(corporationRef);

        querySnapshot.forEach((doc) => {
          const { tags } = doc.data();

          if (
            tags.includes(CorporationTags.CANDIDATE_POOL) &&
            tags.includes(CorporationTags.RECRUITING_SAAS)
          )
            newJobBoards.push(doc.data());
        });
      } catch (e) {
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
    .map(({ name, url, candidatesNumber, jobsNumber }, key) => (
      <div className="col-sm-6 col-md-4 my-2" key={key}>
        <div className="card">
          <div className="card-body">
            <div className="card-title h5">
              {url ? <a href={url}>{name}</a> : { name }}
            </div>
            <div className="card-text">
              {candidatesNumber && (
                <div
                  title="candidate number"
                  className="ps-1"
                  data-toggle="tooltip"
                  data-placement="top"
                >
                  Candidates:{" "}
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    candidatesNumber
                  )}
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
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    jobsNumber
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ));

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
