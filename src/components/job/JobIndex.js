import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./JobConfig";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import WithErrorContent from "../common/WithErrorContent";
import { Link } from "react-router-dom";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig, "jobApp");
export const jobDB = getFirestore(app);

export default function JobIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    async function effectQuery() {
      const newJobs = [];
      const jobRef = collection(jobDB, "job");
      try {
        const querySnapshot = await getDocs(jobRef);
        querySnapshot.forEach((doc) => {
          newJobs.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.error(e);
        setError(e);
      }
      setJobs(newJobs);
      setIsLoading(false);
    }
    effectQuery();
  }, []);

  const results = jobs
    .filter((job) => (phrase ? job.title.match(new RegExp(phrase, "i")) : true))
    .map(({ title, id, company, agent }, idx) => (
      <div className="col-sm-6 col-md-4 my-2" key={idx}>
        <div className="card">
          <div className="card-body">
            <div className="card-title h5">
              <Link to={`/job/${id}`}>{title}</Link>
            </div>
            <div className="card-text">
              {company && (
                <div className="text-muted text-capitalize">
                  {company}
                  {agent && ` / ${agent}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  if (!results.length) return null;
  return (
    <div>
      <h2>Jobs</h2>
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
