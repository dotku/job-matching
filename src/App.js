import { createStore } from "redux";
import { Provider } from "react-redux";
import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Talents } from "./components/Talents";
import Jobs from "./components/job/JobIndex";
import JobDetail from "./components/job/JobDetail";
import Footer from "./components/common/Footer";
import { AgentCompanies as CorporationIndex } from "./components/corporation/CorporationIndex";
import { JobBoards } from "./components/corporation/CorporationJobBoards";
import Header from "./components/common/Header";
import { SearchBar } from "./components/common/SearchBar";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Social from "./components/social";
import BootStrapLabTooltip from "./components/bootstrap-lab";
import Resume from "./components/resume";

export function Home({ phrase }) {
  return (
    <>
      <Talents phrase={phrase} />
      <Jobs phrase={phrase} />
      <JobBoards phrase={phrase} />
      <CorporationIndex phrase={phrase} />
    </>
  );
}

function App() {
  const [phrase, setPhrase] = useState("");
  let handlePhraseChange = (e) => {
    console.log(e.target.value);
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
              <Route path="/talents">
                <Talents phrase={phrase} />
              </Route>
              <Route path="/job/:id" component={JobDetail} />
              <Route path="/story/social" component={Social} />
              <Route path="/resume" component={Resume} />
              <Route
                path="/bootstrap-lab/tooltip"
                component={BootStrapLabTooltip}
              />
            </Switch>
          </div>
        </div>
        <Footer classNames="mt-3" />
      </div>
    </Router>
  );
}

export default App;
