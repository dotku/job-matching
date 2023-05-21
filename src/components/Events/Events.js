import { useContext, useEffect, useRef, useState } from "react";
import { HeightAlignerContext } from "../common/ChildDependHeightAligner";

// @todo, eventually will return a sliders of featured events
export default function Events() {
  const { setHeightAligner } = useContext(HeightAlignerContext);
  const [results, setResults] = useState([]);
  const eventsCardRef = useRef();

  useEffect(() => {
    fetch("/data/events.json")
      .then((rsp) => rsp.json())
      .then((rsp) => setResults(rsp))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateHeight);
  }, []);

  function updateHeight() {
    setHeightAligner({ height: eventsCardRef.current.clientHeight });
  }

  const handleComponentLoad = () => {
    updateHeight();
  };

  return (
    <div className="events" ref={eventsCardRef} onLoad={handleComponentLoad}>
      {results && results.length
        ? results
            .filter((_item, idx) => idx === 0)
            .map(({ url, imgSrc, title, subtitle }, idx) => (
              <div className="card mb-3" key={idx}>
                <a href={url}>
                  <img className="card-img-top" src={imgSrc} alt={title} />
                </a>
                <div className="card-body">
                  <h3 className="card-title">{title}</h3>
                  {subtitle ? (
                    <h6 class="card-subtitle mb-2 text-muted">{subtitle}</h6>
                  ) : null}
                  <div className="text-right">
                    <a
                      href={url}
                      className="btn btn-primary"
                      target="_blank"
                      rel="external noreferrer"
                    >
                      Enter
                    </a>
                  </div>
                </div>
              </div>
            ))
        : null}
    </div>
  );
}
