import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Grid } from "@material-ui/core";
import classnames from "classnames";

const footerStyles = makeStyles({
  root: {
    background: "#333",
    border: 0,
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
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
    <div className={classnames("footer", classes.root, classNames)}>
      <div className="container">
        <Grid container>
          <Grid item xs={3}>
            <div>Job Boards</div>
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
            </ul>
          </Grid>
          <Grid xs={3}>
            <div>Interview Preperation</div>
            <ul>
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
          </Grid>
          <Grid xs={3}>
            <div>Agents</div>
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
          </Grid>
          <Grid xs={3}>
            <div>Join Us</div>
            <ul>
              <li>Welcome to fork and submit pull request.</li>
              <li>
                Email me if you want to join the team weijingjaylin(at)gmail.com
              </li>
            </ul>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
