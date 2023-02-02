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
      <div className="col-sm-6 col-md-4 my-2" key={key}>
        <div className="card">
          <div className="card-body">
            <div className="card-title h5">
              <Link to="/resume">
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
                  <div className=" ms-2" style={{ lineHeight: "52px" }}>
                    {talent.name}
                  </div>
                </div>
              </Link>
            </div>
            <div className="card-text">
              <div className="">
                <span title="Year of Experience">{talent.career_age}yr(s)</span>
                ,{" "}
                <span title="Highest Position">{talent.highest_position}</span>
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
      <div className="row">{results}</div>
    </div>
  );
}
