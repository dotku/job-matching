import classNames from "classnames";
import { getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import WithErrorContent from "../common/WithErrorContent";
import { CorporationCard } from "./CorporationCard";
import { corporationRef } from "./CorporationJobBoards";

export default function CorperationIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [corporations, setCorporations] = useState([]);
  const [ifSortByRenvue, setIfSortByRevnue] = useState(false);

  useEffect(() => {
    async function effectQuery() {
      const newCorporations = [];

      try {
        const querySnapshot = await getDocs(corporationRef);
        querySnapshot.forEach((doc) => {
          newCorporations.push(doc.data());
        });
      } catch (e) {
        console.error(e);
        setError(e);
      }
      setCorporations(newCorporations);
      setIsLoading(false);
    }
    effectQuery();
  }, []);

  const filteredCopoerations = corporations.filter((board) =>
    phrase ? board.name.match(new RegExp(phrase, "i")) : true
  );

  const results = useMemo(
    () =>
      ifSortByRenvue
        ? filteredCopoerations.sort((a, b) => b.revenue - a.revenue)
        : filteredCopoerations,
    [ifSortByRenvue, filteredCopoerations]
  );

  return (
    <div>
      <h2>Corporations</h2>
      <div>
        Total: {results.length} | Sort by{" "}
        <button
          onClick={() => setIfSortByRevnue(!ifSortByRenvue)}
          className={classNames(
            "btn",
            !ifSortByRenvue ? "btn-outline-dark" : "btn-dark"
          )}
        >
          Revenue
        </button>
      </div>
      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <WithErrorContent error={error}>
          <div className="row my-3">
            {results.length
              ? results.map((corporation, idx) => (
                  <CorporationCard {...{ ...corporation }} key={idx} />
                ))
              : "empty content"}
          </div>
        </WithErrorContent>
      )}
      <div className="text-center">
        <form
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
          target="_top"
        >
          <input type="hidden" name="cmd" value="_s-xclick" />
          <input type="hidden" name="hosted_button_id" value="335K4PZWH5ZHJ" />
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_paynowCC_LG.gif"
            border="0"
            name="submit"
            alt="PayPal - The safer, easier way to pay online!"
          />
          <img
            alt=""
            border="0"
            src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif"
            width="1"
            height="1"
          />
        </form>
      </div>
      {/* <h3>Reference</h3>
      <a href="https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/">
        https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/
      </a> */}
    </div>
  );
}
