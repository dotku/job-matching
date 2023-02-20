import { Link } from "react-router-dom";

import styled from "styled-components";

const IT_IS_JUST_A_DIV_WRAPPER = styled.div``;
export default function NotFound() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: 500 }}
    >
      <IT_IS_JUST_A_DIV_WRAPPER>
        <h1>404 - Page Not Found</h1>
        <div>
          Whoops! Take me to <Link to="/">Home Page</Link>.
        </div>
      </IT_IS_JUST_A_DIV_WRAPPER>
    </div>
  );
}
