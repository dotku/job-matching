import HMCYEDoordash from "./HMCYEDoordash";
import HMCYEDoordashFullTime from "./HMCYEDoordashFullTime";
import HMCYESF40K from "./HMCYESF40K";
import HMCYESF5K from "./HMCYESF5K";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import HowMuchYouCanEarnHome from "./HMCYEHome";
import ScrollToTop from "../../components/ScrollToTop";
import Breadcrumbs from "../../components/Breadrumbs";

export { HMCYEDoordash, HMCYEDoordashFullTime, HMCYESF40K, HMCYESF5K };

export function RouteWithSubRoutes(route) {
  return (
    <Route
      path={route.path}
      render={(props) =>
        // pass the sub-routes down to keep nesting
        route.routes ? (
          <route.component
            {...props}
            routes={route.routes}
            exact={route.exact}
          />
        ) : (
          <route.component {...props} exact={route.exact} />
        )
      }
    />
  );
}

const PAGE_PATH = "/how-much-can-you-earn";

export default function HMCYIndex({ routes }) {
  console.log("HMCYIndex routes", routes);
  return (
    <>
      <Router>
        <ScrollToTop />
        <Breadcrumbs routes={routes} />
        <Switch>
          {routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} />
          ))}
        </Switch>
      </Router>
      <h3>Articles</h3>
      <HowMuchYouCanEarnHome />
    </>
  );
}
