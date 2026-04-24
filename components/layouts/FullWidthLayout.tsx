import React from "react";

type MyComponentProps = React.PropsWithChildren<{}>;

const FullWidthLayout: React.FC<MyComponentProps> = ({ children }) => (
  <section className="layout">
    <main className="w-full">{children}</main>
  </section>
);

export default FullWidthLayout;
