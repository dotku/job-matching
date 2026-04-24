import { useContext } from "react";
import { HeightAlignerContext } from "../common/ChildDependHeightAligner";
import LoadingSpinner from "../common/LoadingSpinner";

export default function Tips() {
  const { heightAligner } = useContext(HeightAlignerContext);
  const { height } = heightAligner;

  if (height < 100) return <LoadingSpinner />;

  return (
    <div
      className="card mb-3"
      id="tips-card"
      style={{ height: height || "auto" }}
    >
      <div className="card-body">
        <h3 className="card-title">Simple Recruiting Tips</h3>
        <ol
          style={{
            overflowY: "scroll",
            height: height - 80 || "auto",
          }}
        >
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
