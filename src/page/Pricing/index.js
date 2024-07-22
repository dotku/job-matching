import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import PricingMD from "./Pricing.md";
import { useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import styled from "styled-components";

const StyledMarkdownWrapper = styled.div`
  table {
    margin: calc(1em + 1ex) 0;
    font-feature-settings: "lnum";
    border-collapse: collapse;
    border-spacing: 0;
    display: block;
    font-variant-numeric: lining-nums;
    overflow: auto;
    width: 100%;
  }
  table tr {
    background-color: #fafbfc;
    border-top: 1px solid #d1d5da;
  }
  table th {
    font-weight: 600;
    letter-spacing: 0.2px;
  }
  table th,
  table td {
    border: 1px solid var(--gray-3);
    padding: 0.4em 0.8em;
  }
`;

export default function Pricing() {
  const [content, setContent] = useState("");
  useEffect(() => {
    fetch(PricingMD)
      .then((res) => res.text())
      .then((md) => {
        setContent(md);
      });
  }, []);

  return (
    <StyledMarkdownWrapper>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </StyledMarkdownWrapper>
  );
}
