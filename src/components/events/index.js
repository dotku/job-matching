import { useEffect, useState } from "react";

export default function Events() {
  const [results, setResults] = useState([]);
  useEffect(() => {
    fetch("/react-job-matching/data/events.json")
      .then((rsp) => rsp.json())
      .then((rsp) => setResults(rsp))
      .catch((e) => console.error(e));
  }, []);
  return results && results.length ? (
    results
      .filter((_item, idx) => idx === 0)
      .map((item, idx) => (
        <div className="card mb-3" id="event-card" key={idx}>
          <a href={item.url}>
            <img className="card-img-top" src={item.imgSrc} alt={item.title} />
          </a>
          <div className="card-body text-center">
            <h3 className="card-title">{item.title}</h3>
            <a href={item.url} className="btn btn-primary">
              Register
            </a>
          </div>
        </div>
      ))
  ) : (
    <div>Empty Content</div>
  );
}
