import React from "react";
const jobs = ["front end", "back end", "full stack"];

export function Jobs(props) {
  const { phrase } = props;
  const results = jobs
    .filter((job) => (phrase ? job.match(new RegExp(phrase, "i")) : true))
    .map((job, key) => <li key={key}>{job}</li>);
  if (!results.length) return null;
  return (
    <div>
      <h2>Jobs</h2>
      <ul>{results}</ul>
    </div>
  );
}
