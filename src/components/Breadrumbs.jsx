// Breadcrumbs.tsx
import { Link, useLocation } from "react-router-dom";
import routes from "../routes";

const Breadcrumbs = () => {
  const location = useLocation();

  // Split the pathname into an array of paths
  const paths = location.pathname.split("/").filter((path) => path);
  console.log("routes", routes);
  const parent = routes.find((r) => r.path && r.path.includes(paths[0]));
  console.log("parent", parent);
  const route = parent.routes.find((r) => {
    const pathnames = r.path.split("/");
    return pathnames[pathnames.length - 1].includes(paths[paths.length - 1]);
  });
  console.log("route", route);

  return route ? (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        <li className="breadcrumb-item">
          <Link to={parent.path}>
            {parent.path.replaceAll("/", "").split("-").join(" ")}
          </Link>
        </li>
        <li className="breadcrumb-item active" aria-current="page">
          {paths[paths.length - 1].replaceAll("/", "").split("-").join(" ")}
        </li>
      </ol>
    </nav>
  ) : null;
};

export default Breadcrumbs;
