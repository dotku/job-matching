import styled from "styled-components";
import financeCompanies from "./data/financeCompanies";
import { useContext, useMemo } from "react";
import { AppContext } from "../../../App";

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

  console.log(companies.sort((a, b) => (!b.weight ? -1 : a.weight - b.weight)));

  return (
    <>
      <h2>Financials</h2>
      <ol className="breadcrumb">
        <li>
          <a href="#/">Home</a>
        </li>
        <li>
          <a href="#/industry">Industry</a>
        </li>
        <li className="active">Financials</li>
      </ol>
      {/* <form>
        <label>Ask a question</label>
        <textarea
          className="form-control mb-3"
          placeholder="ask me anything related to finance industry"
        />
        <div className="text-right">
          <button className="btn btn-primary">Ask</button>
        </div>
      </form> */}
      <h3>Companies ({companies.length})</h3>
      <div className="row">
        {companies
          .sort((a, b) => b.weight - a.weight)
          .map(
            (
              { url, name, description, revenue, valuation, collapsed },
              idx
            ) => (
              <div className="col-md-4" key={name}>
                <div className="card mb-3">
                  <div className="card-body">
                    <h3 className="card-title">
                      {collapsed ? (
                        <s>{name}</s>
                      ) : (
                        <a href={url} target="_blank" rel="external noreferrer">
                          {name}
                        </a>
                      )}
                    </h3>
                    <div>{description}</div>
                    <div className="text-right">
                      <StyledLabel>Revenue:</StyledLabel>
                      {revenue ? (
                        <span>
                          {new Intl.NumberFormat("en", {
                            notation: "compact",
                            style: "currency",
                            currency: "USD",
                          }).format(revenue[2022])}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </div>

                    <div className="text-right">
                      <StyledLabel>Valuation: </StyledLabel>
                      {valuation ? (
                        <span>
                          {new Intl.NumberFormat("en", {
                            notation: "compact",
                            style: "currency",
                            currency: "USD",
                          }).format(valuation[2022])}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
      </div>
      <h3>News</h3>
      <h3>Stock</h3>
    </>
  );
}
