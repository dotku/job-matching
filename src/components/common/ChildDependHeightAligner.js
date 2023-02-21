import { createContext, useState } from "react";

export const HeightAlignerContext = createContext();

export default function ChildDependHeightAligner({ children }) {
  const [heightAligner, setHeightAligner] = useState({});
  return (
    <HeightAlignerContext.Provider value={{ heightAligner, setHeightAligner }}>
      {children}
    </HeightAlignerContext.Provider>
  );
}
