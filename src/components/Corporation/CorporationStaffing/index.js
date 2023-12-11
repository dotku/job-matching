import { AgentCompaniesList } from "../CorporationList";
export const agentCompanies = [
  { title: "TEKSystems", url: "https://www.teksystems.com/en" },
  { title: "modis", url: "https://www.modis.com/" },
  { title: "xoriant", url: "http://xoriant.com" },
  { title: "Collabera", url: "http://www.collabera.com/" },
  { title: "Infinity Consulting Solutions", url: "http://www.infinity-cs.com" },
  { title: "US Tech Solutions", url: "https://www.ustechsolutions.com/" },
  { title: "TrustBrain", url: "https://app.usebraintrust.com/r/weijing1/" },
];

export default function CorporationStaffing(props) {
  const { phrase } = props;
  const result = agentCompanies.filter((company) =>
    phrase ? company.title.match(new RegExp(phrase, "i")) : true
  );

  if (!result.length) return null;
  return (
    <div>
      <h2>Agent Companies</h2>
      <AgentCompaniesList items={result} />
    </div>
  );
}
