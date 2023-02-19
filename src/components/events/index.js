import { useEffect, useState } from "react";

export default function Events() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch("/data/events.json")
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
            <a href={item.url} className="btn btn-outline-primary me-3">
              Enter
            </a>
            <div className="text-muted mt-3" style={{ fontSize: 12 }}>
              <small>
                It is a 3rd party event, shared As-Is.{" "}
                <a
                  href="https://jobmatching.us"
                  className="text-muted"
                  style={{ textDecoration: "underline" }}
                >
                  job matching&trade;
                </a>{" "}
                has no affiliate with or obligation for the event.
              </small>
            </div>
          </div>
        </div>
      ))
  ) : (
    <div>Empty Content</div>
  );
}
