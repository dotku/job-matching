import { createContext, useState } from "react";
import "./App.css";
import { Talents } from "./components/user/Talents";
import JobDetail from "./components/job/JobDetail";

import CorporationIndex from "./components/Corporation/CorporationIndex";
import Header from "./components/common/Header";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Social from "./components/social";
import BootStrapLabTooltip from "./components/bootstrap-lab";
import Resume from "./components/resume";
import CareerAI from "./components/careerAI";
import CorporationCreate from "./components/Corporation/CorporationCreate";
import Home from "./page/Home";
import KBVISA from "./components/knowledge-base/visa";
import NotFound from "./components/NotFound";
import AdminCorporations from "./page/Admin/AdminCorporations";
import Terms from "./page/Terms";
import DemoModal from "./components/common/DemoModal";
import Pricing from "./page/Pricing";
import BlogPage from "./page/Blog/page";
import Registration from "./page/Auth/Registration";
import IndustryFinance from "./page/Industry/Finance";
import TOCWorkLifeBalance from "./page/Publication/Work Life Balance: I already chat with ChatGPT, so you don't have to";
import Industry from "./page/Industry/Industry";
import InformationTechnology from "./page/Industry/InformationTechnology";
import IndustrialsSector from "./page/Industry/Industrials/IndustrialsSector";
import ResumeFineTuner from "./page/Toolbox/ResumeFineTuner/ResumeFineTuner";
import JobPortals from "./page/JobPortals";
import { MainLayout } from "./components/layouts";
import HowMuchYouCanEarnIndex, {
  HMCYEDoordashFullTime,
  HMCYEDoordash,
} from "./page/HowMuchCanYouEarn";
import routes from "./routes";
import InternalReferral from "./page/InternalReferral";
// import HMCYEDoordash from "./page/HowMuchCanYouEarn/HMCYEDoordash";

export const AppContext = createContext();

function App() {
  const [appState, setAppState] = useState();
  const [phrase, setPhrase] = useState("");
  let handlePhraseChange = (e) => {
    setPhrase(e.target.value);
    setAppState({ phrase: e.target.value });
  };

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
      <Router>
        <MainLayout>
          <Header phrase={phrase} handlePhraseChange={handlePhraseChange} />
          <div>
            <Switch>
              <Route exact path="/">
                <Home phrase={phrase} />
              </Route>
              <Route path="/admin/corporations">
                <AdminCorporations phrase={phrase} />
              </Route>
              <Route path="/auth/registration">
                <Registration />
              </Route>
              <Route path="/blog">
                <BlogPage />
              </Route>
              <Route path="/toolbox/resume-fine-tuner">
                <ResumeFineTuner />
              </Route>
              <Route path="/demo/modal">
                <DemoModal />
              </Route>
              <Route
                path="/how-much-can-you-earn/"
                render={(props) => {
                  console.log("render props");
                  const route = routes.find(
                    (r) => r.path === "/how-much-can-you-earn/"
                  );
                  return <HowMuchYouCanEarnIndex routes={route.routes} />;
                }}
              />
              {/* <Route path="/how-much-can-you-earn/doordash">
                <HMCYEDoordash />
              </Route>
              <Route path="/how-much-can-you-earn/doordash-full-time">
                <HMCYEDoordashFullTime />
              </Route> */}
              <Route path="/talents">
                <Talents phrase={phrase} />
              </Route>
              <Route path="/corporations">
                <CorporationIndex phrase={phrase} />
              </Route>
              <Route path="/industry" component={Industry} exact={true} />
              <Route
                path="/industry/industrials"
                component={IndustrialsSector}
              />
              <Route path="/industry/financials" component={IndustryFinance} />
              <Route
                path="/industry/information-technology"
                component={InformationTechnology}
              />
              <Route path="/corporation/create" component={CorporationCreate} />
              <Route path="/job/:id" component={JobDetail} />
              <Route path="/story/social" component={Social} />
              <Route exact path="/resume" component={Resume} />
              <Route exact path="/career-ai" component={CareerAI} />
              <Route exact path="/job-portals" component={JobPortals} />
              <Route exact path="/corporation-create" component={CorporationCreate} />
              <Route exact path="/internal-referral" component={InternalReferral} />
              <Route path="/knowledge-base/visa" component={KBVISA} />
              <Route path="/terms" component={Terms} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/publication" component={TOCWorkLifeBalance} />
              <Route
                path="/publication/work-life-balance"
                component={TOCWorkLifeBalance}
              />
              <Route
                path="/bootstrap-lab/tooltip"
                component={BootStrapLabTooltip}
              />
              <Route path="*" component={NotFound} />
            </Switch>
          </div>
        </MainLayout>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
