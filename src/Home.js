import { Talents } from "./components/user/Talents";
import Jobs from "./components/job/JobIndex";
import { JobBoards } from "./components/corporation/CorporationJobBoards";
import CorporationStaffing from "./components/corporation/CorporationStaffing";
import Event from "./components/Event";
import ChildDependHeightAligner from "./components/common/ChildDependHeightAligner";
import Insight from "./components/Tips";

export function Home({ phrase }) {
  return (
    <>
      <ChildDependHeightAligner>
        <div className="row">
          <div className="col-12 col-sm-6">
            <Event />
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
    </>
  );
}
