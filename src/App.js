import { createStore } from "redux";
import { Provider } from "react-redux";
import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Talents } from "./components/Talents";
import { Jobs } from "./components/Jobs";
import Footer from "./components/common/Footer";
import { AgentCompanies } from "./components/AgentCompanies";
import { JobBoards } from "./components/JobBoards";
import Header from "./components/common/Header";
import { SearchBar } from "./components/common/SearchBar";

function App() {
  console.log("process.env", process.env);
  const [phrase, setPhrase] = useState("");
  let handlePhraseChange = (e) => {
    console.log(e.target.value);
    setPhrase(e.target.value);
  };
  return (
    <div className="App">
      <div className="top"></div>
      <div className="container" style={{ minHeight: "calc(100vh - 239px)" }}>
        <Header phrase={phrase} handlePhraseChange={handlePhraseChange} />

        <Talents phrase={phrase} />
        <Jobs phrase={phrase} />
        <JobBoards phrase={phrase} />
        <AgentCompanies phrase={phrase} />
      </div>
      <Footer classNames="mt-3" />
    </div>
  );
}

export default App;
