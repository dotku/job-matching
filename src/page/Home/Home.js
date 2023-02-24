import { Talents } from "../../components/user/Talents";
import Jobs from "../../components/job/JobIndex";
import JobBoards from "../../components/Corporation/CorporationJobBoards";
import CorporationStaffing from "../../components/Corporation/CorporationStaffing";
import Events from "../../components/Events";
import ChildDependHeightAligner from "../../components/common/ChildDependHeightAligner";
import Insight from "../../components/Tips";
import TermsSection from "../Terms/TermsSection";
import { Helmet } from "react-helmet";
import Hero from "./Hero";

const { REACT_APP_WEBSITE_NAME } = process.env;

export function Home({ phrase }) {
  return (
    <>
      <Helmet>
        <title>{REACT_APP_WEBSITE_NAME}</title>
      </Helmet>
      <Hero />
      <ChildDependHeightAligner>
        <div className="row">
          <div className="col-12 col-sm-6">
            <Events />
          </div>
          <div className="col-12 col-sm-6">
            <Insight />
          </div>
        </div>
      </ChildDependHeightAligner>
      <Talents phrase={phrase} />
      <Jobs phrase={phrase} />
      <JobBoards phrase={phrase} />
      <CorporationStaffing phrase={phrase} />
      <TermsSection />
    </>
  );
}
