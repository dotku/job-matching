import { useState } from "react";
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
import { Home } from "./Home";
import KBVISA from "./components/knowledge-base/visa";
import NotFound from "./components/NotFound";
import AdminCorporations from "./page/Admin/AdminCorporations";
import Terms from "./page/Terms";
import DemoModal from "./components/common/DemoModal";

function App() {
  const [phrase, setPhrase] = useState("");
  let handlePhraseChange = (e) => {
    setPhrase(e.target.value);
  };

  return (
    <Router>
      <div className="App">
        <div className="container" style={{ minHeight: "calc(100vh - 239px)" }}>
          <Header phrase={phrase} handlePhraseChange={handlePhraseChange} />
          <div className="container">
            <Switch>
              <Route exact path="/">
                <Home phrase={phrase} />
              </Route>
              <Route path="/admin/corporations">
                <AdminCorporations phrase={phrase} />
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
              <Route path="/corporation/create" component={CorporationCreate} />
              <Route path="/job/:id" component={JobDetail} />
              <Route path="/story/social" component={Social} />
              <Route path="/resume" component={Resume} />
              <Route path="/careerAI" component={CareerAI} />
              <Route path="/knowledge-base/visa" component={KBVISA} />
              <Route path="/terms" component={Terms} />
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
  );
}

export default App;
