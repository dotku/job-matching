import { Helmet } from "react-helmet";

const { REACT_APP_WEBSITE_NAME } = process.env;

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms - {REACT_APP_WEBSITE_NAME}</title>
      </Helmet>
      <dl>
        <dt>OPT</dt>
        <dd>
          F-1 students who have maintained their status and have completed one
          academic year of study in the U.S. may be eligible for Optional
          Practical Training (OPT).
        </dd>
      </dl>
    </>
  );
}
