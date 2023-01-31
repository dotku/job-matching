import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Talents(props) {
  const [talents, setTalents] = useState([]);
  const { phrase } = props;
  useEffect(() => {
    fetch("./data/talents.json")
      .then((rsp) => rsp.json())
      .then((rsp) => setTalents(rsp))
      .catch((e) => console.error(e));
  }, []);
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
