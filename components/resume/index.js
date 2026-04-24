export default function ResumeIndex() {
  return (
    <div className="row">
      <div className="col-md-4 mr-3 mb-3">
        <ResumeSidebar />
      </div>
      <div className="col-md-8 mr-3 mb-3">
        <ResumeBody />
      </div>
    </div>
  );
}

function ResumeSidebar() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-row">
          <span
            style={{ width: "52px", height: "52px", lineHeight: "52px" }}
            className="bg-secondary text-light rounded-circle d-inline-block"
          >
            <div className="d-flex justify-content-center align-items-center">
              <i
                className="bi bi-person-fill h2 mb-0"
                style={{ lineHeight: "52px" }}
              ></i>
            </div>
          </span>
          <span
            className="d-inline-block ms-2 mb-0"
            style={{ lineHeight: "52px" }}
          >
            <strong>$FIRST_NAME, $LAST_NAME</strong>
          </span>
        </div>
        <div></div>
        <div className="mt-2">
          <div className="list-group list-group-flush">
            <strong className="font-weight-bold list-group-item d-flex justify-content-between">
              <span>Total Years of Experience</span>
              <span>10yrs</span>
            </strong>
            <div className="list-group-item d-flex justify-content-between">
              <span>JavaScript</span> <span>10yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>HTML</span> <span>10yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>CSS</span> <span>10yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>React</span> <span>5yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>Machine Learning</span> <span>3yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>Java</span> <span>1yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>PHP</span> <span>5yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>Node</span> <span>3yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>AWS</span> <span>3yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>MySQL</span> <span>5yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>MongoDB</span> <span>1yrs</span>
            </div>
            <div className="list-group-item d-flex justify-content-between">
              <span>Firebase</span> <span>3yrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeBody() {
  return (
    <div className="card">
      <div className="card-body">
        <div>
          <h3>Working Experience</h3>
          {[...Array(3).keys()].map((item, idx) => (
            <div key={idx} className="my-3">
              <div>$POSITION</div>
              <div>$COMPANY_NAME</div>
              <div>$DATE_START, $DATE_END</div>
              <div>$CONTRIBUTIONS</div>
              <div>$TECH_STACK</div>
            </div>
          ))}
          <h3>Education</h3>
          {[...Array(3).keys()].map((item, idx) => (
            <div key={idx} className="my-3">
              <div>$SCHOOL_NAME</div>
              <div>$MAJOR</div>
              <div>$DATE_START, $DATE_END</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
