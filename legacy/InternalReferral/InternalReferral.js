import React, { useState } from 'react';
import { Form, FormGroup, FormControl, ControlLabel, Button, Panel } from 'react-bootstrap';

const InternalReferral = () => {
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    position: '',
    relationship: '',
    referralReason: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container py-5">
      <Panel>
        <Panel.Heading>
          <Panel.Title>Internal Referral</Panel.Title>
          <p className="text-muted">
            Submit a referral for someone you know who would be a great fit for our company.
          </p>
        </Panel.Heading>
        <Panel.Body>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <ControlLabel>Candidate Name</ControlLabel>
              <FormControl
                type="text"
                name="candidateName"
                value={formData.candidateName}
                onChange={handleChange}
                required
                placeholder="Enter candidate's full name"
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>Candidate Email</ControlLabel>
              <FormControl
                type="email"
                name="candidateEmail"
                value={formData.candidateEmail}
                onChange={handleChange}
                required
                placeholder="Enter candidate's email"
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>Position</ControlLabel>
              <FormControl
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="Enter the position they're interested in"
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>Your Relationship to Candidate</ControlLabel>
              <FormControl
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                required
                placeholder="How do you know the candidate?"
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>Why are you referring them?</ControlLabel>
              <FormControl
                componentClass="textarea"
                name="referralReason"
                value={formData.referralReason}
                onChange={handleChange}
                required
                placeholder="Please explain why you think they would be a good fit"
                rows={4}
              />
            </FormGroup>

            <Button 
              type="submit"
              bsStyle="primary"
              className="w-100"
            >
              Submit Referral
            </Button>
          </Form>
        </Panel.Body>
      </Panel>
    </div>
  );
};

export default InternalReferral;
