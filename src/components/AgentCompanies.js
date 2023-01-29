import classNames from "classnames";
import React from "react";
export const agentCompanies = [
  { title: "TEKSystems", url: "https://www.teksystems.com/en" },
  { title: "modis", url: "https://www.modis.com/" },
  { title: "xoriant", url: "http://xoriant.com" },
  { title: "Collabera", url: "http://www.collabera.com/" },
  { title: "Infinity Consulting Solutions", url: "http://www.infinity-cs.com" },
  { title: "US Tech Solutions", url: "https://www.ustechsolutions.com/" },
  { title: "TrustBrain", url: "https://app.usebraintrust.com/r/weijing1/" },
];

export function AgentCompaniesList({ items, linkClassNames }) {
  return items && items.length ? (
    <ul>
      {items.map((items, key) => (
        <li key={key}>
          {!items.url ? (
            items.title
          ) : (
            <a href={items.url} className={classNames(linkClassNames)}>
              {items.title}
            </a>
          )}
        </li>
      ))}
    </ul>
  ) : null;
}

export function AgentCompanies(props) {
  const { phrase } = props;
  const result = agentCompanies.filter((company) =>
    phrase ? company.match(new RegExp(phrase, "i")) : true
  );

  if (!result.length) return null;
  return (
    <div>
      <h2>Agent Companies</h2>
      <AgentCompaniesList items={result} />
    </div>
  );
}
