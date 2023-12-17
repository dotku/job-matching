import { useRef, useState } from "react";
import JMEdtior from "../../../components/JMEditor/JMEditor";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

export default function ResumeFineTuner() {
  const [fineTunedResume, setFineTunedResume] = useState(
    "> **fine tuned resume will display here**"
  );
  const [ifProcessing, setIfProcessing] = useState(false);
  const refJobDescriptionInput = useRef();
  const refResumeInput = useRef();
  const refInstructInput = useRef();

  const handleGenNewResumeClick = () => {
    console.log("refJobDescriptionInput.value");
    const jobDescriptionContent = refJobDescriptionInput.current.currentContent;
    const resumeContent = refResumeInput.current.currentContent;
    const instructContent = refInstructInput.current.currentContent;
    setIfProcessing(true);
    fetch("https://finai-server.deno.dev/openai/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: jobDescriptionContent,
          },
          {
            role: "system",
            content: resumeContent,
          },
          {
            role: "user",
            content: `${instructContent}. Generate a resume for me!`,
          },
        ],
        model: { name: "gpt-4" },
      }),
    })
      .then((rsp) => rsp.json())
      .then((rsp) => setFineTunedResume(rsp.choices[0].message.content))
      .catch((err) => console.error(err))
      .finally(() => {
        setIfProcessing(false);
      });
  };

  return (
    <>
      <h2>Resume Fine Tuner</h2>
      <div className="my-2">
        <JMEdtior
          ref={refJobDescriptionInput}
          value={"<p>1. Copy paste the job requirement here</p>"}
        />
      </div>
      <div className="my-2">
        <JMEdtior
          ref={refResumeInput}
          value={"<p>2. Copy and paste your resume here</p>"}
        />
      </div>
      <div className="my-2">
        <JMEdtior
          ref={refInstructInput}
          value={
            "<p>3. Add your preference or improvment feedback on the result if you are not satififed the fined resume return.</p>"
          }
        />
      </div>
      <button className="btn btn-primary" onClick={handleGenNewResumeClick}>
        Improved Resume By AI
      </button>
      <a
        className="btn btn-warning mx-2"
        title="human agent is not ready yet, click here to apply to be our resume auditing agent email or text (415)851-1937"
        href="mailto:jaytech202307@gmail.com"
      >
        Improved Resume By Human
      </a>
      <div className="my-5">
        {ifProcessing ? (
          <span>processing...</span>
        ) : (
          <ReactMarkdown>{fineTunedResume}</ReactMarkdown>
        )}
      </div>
    </>
  );
}
