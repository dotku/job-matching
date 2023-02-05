export function CorporationCard({
  name,
  url,
  candidatesNumber,
  jobsNumber,
  corporationNumber,
  memberNumber,
  revenue,
  description,
}) {
  return (
    <div className="col-sm-6 col-md-4 my-2">
      <div className="card">
        <div className="card-body">
          <div className="card-title h5">
            {url ? <a href={url}>{name}</a> : name}
          </div>
          <div className="card-text">
            {memberNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Members:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(memberNumber)}
              </div>
            )}
            {candidatesNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Candidates:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(candidatesNumber)}
              </div>
            )}
            {jobsNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Jobs:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(jobsNumber)}
              </div>
            )}
            {corporationNumber && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Corporations:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(corporationNumber)}
              </div>
            )}
            {revenue && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                Revenue:{" "}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                  style: "currency",
                  currency: "USD",
                }).format(revenue)}
              </div>
            )}
            {description && (
              <div
                title="candidate number"
                className="ps-1"
                data-toggle="tooltip"
                data-placement="top"
              >
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
