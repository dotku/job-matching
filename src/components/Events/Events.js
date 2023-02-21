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
            .map((item, idx) => (
              <div className="card mb-3" key={idx}>
                <a href={item.url}>
                  <img
                    className="card-img-top"
                    src={item.imgSrc}
                    alt={item.title}
                  />
                </a>
                <div className="card-body text-center">
                  <h3 className="card-title">{item.title}</h3>
                  <a href={item.url} className="btn btn-primary">
                    Register
                  </a>
                </div>
              </div>
            ))
        : null}
    </div>
  );
}
