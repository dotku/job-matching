export default function Report() {
  return (
    <div>
      <h2>Immigrants Report 2022</h2>
      <div className="row my-3">
        <div className="col col-sm-6">
          <div className="card">
            <div className="card-body">
              <div className="h1">211,858</div>
              <div>Total Visa</div>
            </div>
          </div>
        </div>
        <div className="col col-sm-6">
          <div className="card">
            <div className="card-body">
              <div className="h1">55,058</div>
              <div>Career Visa</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 my-3">
          <h3>Non Career Based Immigrants</h3>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">Mexico 20,316</li>
            <li className="list-group-item">Dominican Republic 12,918</li>
            <li className="list-group-item">Vietnam 11,525</li>
            <li className="list-group-item">Cuba 10,790</li>
            <li className="list-group-item">El Salvador 10,273</li>
            <li className="list-group-item">India 9,147</li>
            <li className="list-group-item">China 7,600</li>
          </ul>
        </div>
        <div className="col-sm-6 my-3">
          <h3>Career Based Immigrants</h3>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">EB1 6,674/3,566 (Total/China)</li>
            <li className="list-group-item">EB2 5,468</li>
            <li className="list-group-item">EB3 32,466</li>
            <li className="list-group-item">EB5 6,882/4,060 (Total/China)</li>
          </ul>
        </div>
      </div>

      <div>
        <h5>Reference</h5>
        <ul>
          <li>
            Directory of Visa Categories:{" "}
            <a href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/all-visa-categories.html">
              https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/all-visa-categories.html
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
