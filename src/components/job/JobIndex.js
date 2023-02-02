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
      console.log("jobRef", jobRef);
      try {
        const querySnapshot = await getDocs(jobRef);
        console.log("querySnapshot", querySnapshot);
        querySnapshot.forEach((doc) => {
          console.log("doc.data()", doc.data());
          newJobs.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.error(e);
        setError(e);
      }
      console.log("newJobs", newJobs);
      setJobs(newJobs);
      setIsLoading(false);
    }
    effectQuery();
  }, []);

  const results = jobs
    .filter((job) => (phrase ? job.title.match(new RegExp(phrase, "i")) : true))
    .map(({ title, id }, idx) => (
      <div className="col-sm-6 col-md-4 my-2" key={idx}>
        <div className="card">
          <div className="card-body">
            <div className="card-title h5">
              <Link to={`/job/${id}`}>{title}</Link>
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
