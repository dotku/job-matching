import classNames from "classnames";
import React from "react";

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
