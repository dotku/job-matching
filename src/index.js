import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import React from "react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { createRoot } from "react-dom/client";
const container = document.getElementById("root");
// const root = hydrateRoot(container, <App tab="home" />);
const root = createRoot(container);

root.render(<App tab="home" />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
