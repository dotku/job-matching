import { useState } from "react";

export function ProfileWelcome() {
  const [profileWelcomeState, setProfileWelcomeState] = useState({
    Identity: { JobSeeker: false, Employeer: false },
    JobSeekerPerference: {
      WorkExperience: [
        "Under Graduated",
        "New Graduated",
        "Graduated",
        "Entry Level",
        "Mid Level",
        "Senior Level",
      ],
      JobType: ["Full Time", "Part Time", "Contract", "Internship"],
    },
    EmployeerPerference: {
      CompanySize: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      CompanyType: [
        "Startup",
        "Small Business",
        "Medium Business",
        "Large Business",
      ],
    },
  });

  return (
    <>
      <h2>Welcome</h2>
      <div>What's your identity?</div>
      <ul className="list-group">
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="firstCheckbox"
          />
          <label className="form-check-label" for="firstCheckbox">
            Job Seecker
          </label>
        </li>
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="secondCheckbox"
          />
          <label className="form-check-label" for="secondCheckbox">
            Employeer
          </label>
        </li>
        {profileWelcomeState.Identity.JobSeeker ? (
          <JobSeekerPerference />
        ) : null}
        {profileWelcomeState.Identity.Employeer ? (
          <EmployeerPerference />
        ) : null}
      </ul>
    </>
  );
}

function EmployeerPerference() {
  return (
    <>
      <h2>Employeer Perference</h2>
      <div>What's your identity?</div>
      <ul className="list-group">
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="firstCheckbox"
          />
          <label className="form-check-label" for="firstCheckbox">
            What's your company size?
          </label>
        </li>
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="secondCheckbox"
          />
          <label className="form-check-label" for="secondCheckbox">
            What's your company type?
          </label>
        </li>
      </ul>
    </>
  );
}

function JobSeekerPerference() {
  return (
    <>
      <h2>Job Seeker Perference</h2>
      <div>What's your identity?</div>
      <ul className="list-group">
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="firstCheckbox"
          />
          <label className="form-check-label" for="firstCheckbox">
            Are you a new graduated student?
          </label>
        </li>
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="checkbox"
            value=""
            id="secondCheckbox"
          />
          <label className="form-check-label" for="secondCheckbox">
            Employeer
          </label>
        </li>
      </ul>
    </>
  );
}
