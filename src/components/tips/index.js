import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";

export default function Tips() {
  const [referenceHeight, setReferenceHeight] = useState();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    function handleResize() {
      setReferenceHeight(document.querySelector("#event-card").clientHeight);
      setIsLoading(false);
    }
    setTimeout(() => {
      handleResize();
    }, 200);
    window.addEventListener("resize", handleResize);
  }, []);

  return isLoading ? (
    <LoadingSpinner />
  ) : (
    <div
      className="card mb-3"
      id="tips-card"
      style={{ height: referenceHeight }}
    >
      <div className="card-body">
        <h3 className="card-title">Simple Recruiting Tips</h3>
        <ol style={{ overflowY: "scroll", height: referenceHeight - 80 }}>
          <li>Encourage employee referrals</li>
          <li>Prioritize the candidate experience</li>
          <li>Have a great offboarding process</li>
          <li>Blind auditions, focusing on candidate performance</li>
          <li>Practice collaborative hiring</li>
          <li>Write better job descriptions</li>
          <li>Value quality over quantity</li>
          <li>Communicate a strong Employee Value Proposition</li>
          <li>Explore remote work arrangements</li>
          <li>Get clear (and realistic) about timelines</li>
          <li>Use an interview rubric or scorecard</li>
          <li>Don't discount previous candidates</li>
        </ol>
      </div>
    </div>
  );
}
