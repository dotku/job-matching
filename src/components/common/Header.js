import React from "react";
import { SearchBar } from "./SearchBar";

export default function Header({ phrase, handlePhraseChange }) {
  return (
    <div className="header d-flex justify-content-between align-items-center">
      <h1 className="my-3">JOB MATCHING</h1>
      <div className="d-flex  h-100">
        <SearchBar value={phrase} onChange={handlePhraseChange} />
      </div>
    </div>
  );
}
