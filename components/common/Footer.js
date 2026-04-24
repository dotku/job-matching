import React from "react";
import { makeStyles } from "@material-ui/styles";
import classnames from "classnames";

const footerStyles = makeStyles({
  root: {
    background: "#333",
    border: 0,
    color: "white",
    padding: "30px",
    "& a": {
      color: "white",
    },
  },
});

export default function Footer({ classNames }) {
  const classes = footerStyles();
  return (
    <footer className={classnames("footer", classes.root, classNames)}>
      <div className="container">
        <div className="row">
          <div className="col-md-3 col-xs-6">
            <h3>Job Boards</h3>
            <ul>
              <li>
                <a href="https://hired.com/x/1cebk">Hired</a>
              </li>
              <li>
                <a href="https://woo.io">Woo.io</a>
              </li>
              <li>
                <a href="https://www.linkedin.com">LinkedIn</a>
              </li>
              <li>
                <a href="https://angel.co">Angel.co</a>
              </li>
              <li>
                <a href="https://www.indeed.com/">indeed</a>
              </li>
              <li>
                <a href="https://www.dice.com/">Dice</a>
              </li>
              <li>
                <a href="https://www.sfhsa.org/services/jobs/jobsnow">
                  JobsNow!
                </a>
              </li>
            </ul>
          </div>
          <div className="col-md-3 col-xs-12">
            <h3>Interview Preparation</h3>
            <ul>
              <li><a href="https://aipin.io/">AIPin</a></li>
              <li>
                <a href="http://interviewcake.com">InterviewCake</a>
              </li>
              <li>
                <a href="https://www.pramp.com/#/">Pramp</a>
              </li>
              <li>
                <a href="https://leetcode.com">LeetCode</a>
              </li>
              <li>
                <a href="https://www.hackerrank.com">HackerRank</a>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h3>Agents</h3>
            <ul>
              <li>
                <a href="https://www.teksystems.com/en">TEKSystems</a>
              </li>
              <li>
                <a href="https://www.modis.com/">modis</a>
              </li>
              <li>
                <a href="http://xoriant.com">xoriant</a>
              </li>
              <li>
                <a href="http://www.collabera.com/">Collabera</a>
              </li>
              <li>
                <a href="http://www.infinity-cs.com">
                  Infinity Consulting Solutions
                </a>
              </li>
              <li>
                <a href="https://www.ustechsolutions.com/">US Tech Solutions</a>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h3>Join Us</h3>
            <ul>
              <li>
                Welcome to{" "}
                <a href="https://github.com/dotku/job-matching">
                  fork and submit pull request
                </a>
                .
              </li>
              <li>
                Email me if you want to join the team{" "}
                <a href="mailto:jobmatching2023@gmail.com">
                  jobmatching2023(at)gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <small className="d-block small text-center">
          Copyrights &copy; 2019 - {new Date().getFullYear()}
        </small>
      </div>
    </footer>
  );
}
