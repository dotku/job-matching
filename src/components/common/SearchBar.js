import React from "react";

export function SearchBar(props) {
  return <input value={props.phrase} onChange={props.onChange} />;
}
