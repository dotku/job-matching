import { createContext, useState } from "react";
import "./App.css";
import { Talents } from "./components/user/Talents";
import JobDetail from "./components/job/JobDetail";
import Footer from "./components/common/Footer";
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
import Registration from "./page/Auth/Registration";
import IndustryFinance from "./page/Industry/Finance";
import TOCWorkLifeBalance from "./page/Publication/Work Life Balance: I already chat with ChatGPT, so you don't have to";
import Industry from "./page/Industry/Industry";
import InformationTechnology from "./page/Industry/InformationTechnology";

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
        <div className="App">
          <div
            className="container"
            style={{ minHeight: "calc(100vh - 237px)" }}
          >
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
                <Route path="/demo/modal">
                  <DemoModal />
                </Route>
                <Route path="/talents">
                  <Talents phrase={phrase} />
                </Route>
                <Route path="/corporations">
                  <CorporationIndex phrase={phrase} />
                </Route>
                <Route path="/industry" component={Industry} exact={true} />
                <Route
                  path="/industry/financials"
                  component={IndustryFinance}
                />
                <Route
                  path="/industry/information-technology"
                  component={InformationTechnology}
                />
                <Route
                  path="/corporation/create"
                  component={CorporationCreate}
                />
                <Route path="/job/:id" component={JobDetail} />
                <Route path="/story/social" component={Social} />
                <Route path="/resume" component={Resume} />
                <Route path="/careerAI" component={CareerAI} />
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
          </div>
          <Footer classNames="mt-3" />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
