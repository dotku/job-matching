import { getDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import WithErrorContent from "../common/WithErrorContent";
import { jobDB } from "./JobIndex";

export default function JobDetail() {
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState(null);

  useEffect(() => {
    async function effectQuery() {
      const jobRef = doc(jobDB, "job", id);
      try {
        const querySnapshot = await getDoc(jobRef);
        setJob(querySnapshot.data());
      } catch (e) {
        console.error(e);
        setError(e);
      }

      setIsLoading(false);
    }
    effectQuery();
    // @note we don't have to track job ID change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (isLoading) return <div>Loading ...</div>;
  return (
    <WithErrorContent error={error}>
      <div>
        <h2>{job.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: job.content }} />
      </div>
    </WithErrorContent>
  );
}
