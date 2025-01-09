import React from 'react';
import { Panel, Button } from 'react-bootstrap';

const JobPortals = () => {
  const jobPortals = [
    {
      name: 'IBM Careers',
      url: 'https://ibm.com/careers',
      description: 'Explore career opportunities at IBM'
    }
  ];

  return (
    <div className="container py-5">
      <h1 className="mb-4">Job Portals</h1>
      <div className="row">
        {jobPortals.map((portal, index) => (
          <div key={index} className="col-md-4 mb-4">
            <Panel>
              <Panel.Heading>
                <Panel.Title>{portal.name}</Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <p>{portal.description}</p>
                <Button 
                  bsStyle="primary" 
                  href={portal.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Portal
                </Button>
              </Panel.Body>
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobPortals;
