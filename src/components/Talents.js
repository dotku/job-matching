import React from "react";
import { Link, useLocation } from "react-router-dom";

const talents = ["John", "Jerry", "Merry"];
export function Talents(props) {
  const location = useLocation();
  console.log("location", location);
  const { phrase } = props;
  const results = talents
    .filter((talent) => (phrase ? talent.match(new RegExp(phrase, "i")) : true))
    .map((talent, key) => <li key={key}>{talent}</li>);
  if (!results.length) return null;
  return (
    <div>
      <Link to="talents">
        <h2 className="d-inline-block">Talents</h2>
      </Link>
      <ul>{results}</ul>
    </div>
  );
}
