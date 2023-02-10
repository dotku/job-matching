import { Talents } from "./components/Talents";
import Jobs from "./components/job/JobIndex";
import { JobBoards } from "./components/corporation/CorporationJobBoards";
import CorporationStaffing from "./components/corporation/CorporationStaffing";
import Events from "./components/events";
import Insight from "./components/tips";

export function Home({ phrase }) {
  return (
    <>
      <div className="row">
        <div className="col-6"><Events /></div>
        <div className="col-6"><Insight /></div>
      </div>
      <Talents phrase={phrase} />
      <Jobs phrase={phrase} />
      <JobBoards phrase={phrase} />
      <CorporationStaffing phrase={phrase} />
    </>
  );
}
