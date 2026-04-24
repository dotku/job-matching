import { Helmet } from "react-helmet";
import TermsSection from "./TermsSection";

const { REACT_APP_WEBSITE_NAME } = process.env;

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms - {REACT_APP_WEBSITE_NAME}</title>
      </Helmet>
      <TermsSection />
    </>
  );
}
