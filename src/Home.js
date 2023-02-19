import { Talents } from "./components/user/Talents";
import Jobs from "./components/job/JobIndex";
import { JobBoards } from "./components/corporation/CorporationJobBoards";
import CorporationStaffing from "./components/corporation/CorporationStaffing";
import Events from "./components/events";
import RegisterSignInForm from "./components/auth/RegisterSignInForm";
import RegisterSignInFormGoogle from "./components/auth/RegisterSignInFormGoogle";

export function Home({ phrase }) {
  return (
    <>
      <div className="row">
        <div className="col-12 col-sm-6">
          <Events />
        </div>
        <div className="col-12 col-sm-6">
          <RegisterSignInForm />
        </div>
      </div>
      <Talents phrase={phrase} />
      <Jobs phrase={phrase} />
      <JobBoards phrase={phrase} />
      <CorporationStaffing phrase={phrase} />
    </>
  );
}
