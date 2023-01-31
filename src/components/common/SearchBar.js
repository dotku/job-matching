import React from "react";

export function SearchBar(props) {
  return (
    <input
      className="form-control"
      value={props.phrase}
      onChange={props.onChange}
      placeholder="Search"
    />
  );
}
