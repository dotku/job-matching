import { Button, Modal } from "react-bootstrap";
import PayPalButton from "./PaypalButton";

export default function PaypalModal({ show, handleClose }) {
  return (
    <Modal show={show}>
      <Modal.Header style={{ display: "block" }}>
        <Modal.Title>Support Us</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Dear,</p>

        <p>
          I am excited to offer my support for your Human Resource market
          research project. As an HR professional, I understand the value of
          having access to reliable and up-to-date information on industry
          trends and challenges. Your project has the potential to provide
          invaluable insights into the current state of the HR market, and I
          believe that it will be a valuable resource for businesses and
          professionals alike.
        </p>

        <p>
          I am impressed by your dedication and commitment to producing a
          high-quality report that can be used by a broad range of stakeholders.
          Your efforts to gather comprehensive data and analyze it in a rigorous
          and systematic way demonstrate your commitment to producing a report
          that is both informative and actionable.
        </p>

        <p>
          I believe that this project has the potential to make a real
          difference in the field of HR, and I am excited to see the results of
          your research. Please let me know how I can support your efforts, and
          I look forward to hearing more about your progress.
        </p>

        <p>
          Sincerely,
          <br />
          Job Matching Team
        </p>

        <PayPalButton />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
