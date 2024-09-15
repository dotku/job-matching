import { HashRouter as Router, Switch, Route, Link } from "react-router-dom";
import rootRoutes from "../../routes";

export default function HowMuchYouCanEarnHome() {
  const { routes } = rootRoutes.find(
    (r) => r.path === "/how-much-can-you-earn/"
  );

  console.log("routes", routes);
  return (
    <ul className="list-group list-group-flush">
      {routes
        .filter((route) => route.path !== "/how-much-can-you-earn/")
        .map((route, i) => (
          <li key={i} className="list-group-item">
            <Link to={`${route.path}`}>{route.name}</Link>
          </li>
        ))}
    </ul>
  );
}
