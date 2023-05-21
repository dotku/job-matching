import styled from "styled-components";
import financeCompanies from "./data/financeCompanies";
import { useContext, useMemo } from "react";
import { AppContext } from "../../App";

const StyledLabel = styled.label`
  font-weight: 600;
  margin-right: 4px;
`;

export default function IndustryFinance() {
  const { appState } = useContext(AppContext);
  const companies = useMemo(() => {
    return appState?.phrase
      ? financeCompanies.filter(
          (company) =>
            company.name
              .toLowerCase()
              .includes(appState.phrase.toLowerCase()) ||
            company.description
              .toLowerCase()
              .includes(appState.phrase.toLowerCase())
        )
      : financeCompanies;
  }, [appState?.phrase]);

  return (
    <>
      <h2>Finance </h2>
      <form>
        <label>Ask a question</label>
        <textarea
          className="form-control mb-3"
          placeholder="ask me anything related to finance industry"
        />
        <div className="text-right">
          <button className="btn btn-primary">Ask</button>
        </div>
      </form>
      <h3>Companies ({companies.length})</h3>
      <div className="row">
        {companies.map((company) => (
          <div className="col-md-4">
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="card-title">
                  <a
                    href={company.url}
                    target="_blank"
                    rel="external noreferrer"
                  >
                    {company.name}
                  </a>
                </h3>
                <div>{company.description}</div>
                <div className="text-right">
                  <StyledLabel>Revenue:</StyledLabel>
                  {company.revenue ? (
                    <span>
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        style: "currency",
                        currency: "USD",
                      }).format(company.revenue[2022])}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>

                <div className="text-right">
                  <StyledLabel>Valuation:</StyledLabel>
                  {company.valuation ? (
                    <span>
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        style: "currency",
                        currency: "USD",
                      }).format(company.valuation[2022])}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
