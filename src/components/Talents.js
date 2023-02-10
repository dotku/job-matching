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
                <div className="ms-2 flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <div>
                      <span className="h5">
                        <Link to="/resume" className="mb-0">
                          {talent.name}
                        </Link>
                      </span>
                      <span title="Year of Experience" className="ms-1">
                        {talent.career_age}yr(s)
                      </span>
                    </div>
                    {talent.salary && (
                      <div title="Salary" className="text-end">
                        {new Intl.NumberFormat("en", {
                          notation: "compact",
                          style: "currency",
                          currency: "USD",
                        }).format(talent.salary)}
                      </div>
                    )}
                  </div>

                  <div>
                    <span>{talent.highest_position}</span>
                    {talent.current_company && (
                      <span>
                        {" at "}
                        <Link to={`/coperation/${talent.current_company}`}>
                          {talent.current_company}
                        </Link>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0 pt-3">
              <div>{talent.looking_for}</div>
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
      <div className="row mb-3">{results}</div>
    </div>
  );
}
