import React from "react";
const jobBoards = ["Hired", "Woo.io", "LinkedIn", "Angel.co", "indeed", "Dice"];

export function JobBoards(props) {
  const { phrase } = props;
  const results = jobBoards
    .filter((board) => (phrase ? board.match(new RegExp(phrase, "i")) : true))
    .map((board, key) => <li key={key}>{board}</li>);
  if (!results.length) return null;
  return (
    <div>
      <h2>Job Boards</h2>
      <ul>{results}</ul>
    </div>
  );
}
