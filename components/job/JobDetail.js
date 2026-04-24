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
      <div className="mb-5">
        <h2>{job.title}</h2>
        {job.company && (
          <div>
            <strong>{job.company}</strong>
          </div>
        )}
        {job.referenceJobID && (
          <div>
            <small>{job.referenceJobID}</small>
          </div>
        )}
        <div
          dangerouslySetInnerHTML={{ __html: job.content }}
          className="my-3"
        />
        {job.contact_name && (
          <div className="text-center mt-4">
            {job.contact_email && (
              <a
                href={`mailto:${job.contact_email}?subject=Regarding the job ${job.title}&body=%0D%0A%0D%0A%0D%0Asent from job-matching`}
                className="btn btn-outline-dark"
              >
                Apply
              </a>
            )}
          </div>
        )}
      </div>
    </WithErrorContent>
  );
}
