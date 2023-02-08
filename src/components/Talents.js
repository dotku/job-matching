import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Talents(props) {
  const [talents, setTalents] = useState([]);
  const { phrase } = props;
  useEffect(() => {
    fetch("/react-job-matching/data/talents.json")
      .then((rsp) => rsp.json())
      .then((rsp) => setTalents(rsp))
      .catch((e) => console.error(e));
  }, []);
  const results = talents
    .filter((talent) =>
      phrase ? talent.name.match(new RegExp(phrase, "i")) : true
    )
    .map((talent, key) => (
      <div className="col-sm-6 my-2" key={key}>
        <div className="card">
          <div className="card-body">
            <div className="card-title mb-0">
              <div className="d-flex flex-row">
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    lineHeight: "52px",
                  }}
                  className="bg-secondary text-light rounded-circle d-inline-block"
                >
                  <div className="d-flex justify-content-center align-items-center">
                    <i
                      className="bi bi-person-fill h2 mb-0"
                      style={{ lineHeight: "52px" }}
                    ></i>
                  </div>
                </div>
                <div className="ms-2">
                  <div className="h5 mb-0">
                    <Link to="/resume">{talent.name}</Link>
                    {talent.current_company && (
                      <>
                        {` (`}
                        <Link to={`/coperation/${talent.current_company}`}>
                          {talent.current_company}
                        </Link>
                        {`)`}
                      </>
                    )}
                  </div>
                  <div>
                    <span title="Year of Experience">
                      {talent.career_age}yr(s)
                    </span>
                    <span className="ms-1">{talent.highest_position}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  if (!results.length) return null;
  return (
    <div>
      <Link to="talents">
        <h2 className="d-inline-block">Candidates</h2>
      </Link>
      <div className="row my-3">{results}</div>
    </div>
  );
}
