import React from "react";
import Footer from "../common/Footer";

type MyComponentProps = React.PropsWithChildren<{}>;

const MainLayout: React.FC<MyComponentProps> = ({ children }) => (
  <div className="App">
    <div className="container" style={{ minHeight: "calc(100vh - 237px)" }}>
      <main>{children}</main>
    </div>
    <Footer classNames="mt-3" />
  </div>
);

export default MainLayout;
