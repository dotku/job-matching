import classNames from "classnames";
import {
  getDocs,
  startAt,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import PayPalButton from "../common/PaypalButton";
import WithErrorContent from "../common/WithErrorContent";
import { CorporationCard } from "./CorporationCard";
import { corporationRef } from "./CorporationJobBoards";

const ITEM_SIZE_PER_PAGE = 12;

export default function CorporationIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [corporations, setCorporations] = useState([]);
  const [ifSortByRenvue, setIfSortByRevnue] = useState(false);
  const [querySnapshot, setQuerySnapshot] = useState(null);
  const [startAfterDoc, setStartAfterDoc] = useState(null);
  const [prevQuery, setPrevQuery] = useState(null);

  useEffect(() => {
    async function effectQuery() {
      const newCorporations = [];

      try {
        getDocs(corporationRef)
          .then((querySnapshot) => {
            setTotal(querySnapshot.size);
          })
          .catch((error) => {
            console.error(error);
          });
        const q = query(
          corporationRef,
          orderBy("revenue", "desc"),
          limit(ITEM_SIZE_PER_PAGE)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          newCorporations.push(doc.data());
        });
        setQuerySnapshot(querySnapshot);
      } catch (e) {
        console.error(e);
        setError(e);
      }
      setCorporations(newCorporations);
      setIsLoading(false);
    }
    effectQuery();
  }, []);

  const handleNextClick = () => {
    const newCorporations = [];
    console.log("querySnapshot.docs.length", querySnapshot.docs.length);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const firstDocument = querySnapshot.docs[0];
    console.log("last", lastVisible);
    setStartAfterDoc(lastVisible);
    const q = query(
      corporationRef,
      orderBy("revenue", "desc"),
      startAfter(lastVisible),
      limit(ITEM_SIZE_PER_PAGE)
    );

    setPrevQuery(
      query(
        corporationRef,
        orderBy("revenue", "desc"),
        endBefore(firstDocument),
        limit(ITEM_SIZE_PER_PAGE)
      )
    );

    getDocs(q)
      .then((newQuerySnapshot) => {
        setQuerySnapshot(newQuerySnapshot);
        newQuerySnapshot.forEach((doc) => {
          console.log("doc.data()", doc.data());
          newCorporations.push(doc.data());
        });
        setCorporations(newCorporations);
        setPage((page) => ++page);
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const handlePrevClick = async () => {
    await getDocs(prevQuery).then((newQuerySnapshot) => {
      const newCorporations = [];
      setQuerySnapshot(newQuerySnapshot);
      newQuerySnapshot.forEach((doc) => {
        newCorporations.push(doc.data());
      });
      setCorporations(newCorporations);
      setPage((page) => --page);
    });
  };

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
      <div className="d-flex justify-content-between">
        <div>
          Page: {page} / {Math.floor(total / ITEM_SIZE_PER_PAGE)} | Sort by{" "}
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
        <div>
          <button
            className="btn btn-outline-dark ms-1"
            onClick={handlePrevClick}
            disabled={page <= 1}
          >
            Prev
          </button>

          <button
            className="btn btn-outline-dark ms-1"
            onClick={handleNextClick}
            disabled={page >= Math.floor(total / ITEM_SIZE_PER_PAGE)}
          >
            Next
          </button>
        </div>
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
      <PayPalButton />
      {/* <h3>Reference</h3>
      <a href="https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/">
        https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/
      </a> */}
    </div>
  );
}
