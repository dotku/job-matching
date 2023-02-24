import {
  getDocs,
  startAt,
  query,
  orderBy,
  limit,
  startAfter,
  endAt,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import WithErrorContent from "../../components/common/WithErrorContent";
import { CorporationCard } from "../../components/Corporation/CorporationCard";
import { corporationRef } from "../../components/Corporation/CorporationJobBoards";
import BootstrapTable from "react-bootstrap-table-next";
import "./AdminCorporations.css";

const ITEM_SIZE_PER_PAGE = 1000;
const columns = [
  {
    text: "name",
    dataField: "name",
    sort: true,
    formatter: (cell, row) => <a href={row["url"]}>{cell}</a>,
  },
  {
    text: "revenue",
    dataField: "revenue",
    sort: true,
    formatter: (cell) =>
      cell &&
      new Intl.NumberFormat("en", {
        notation: "compact",
        style: "currency",
        currency: "USD",
      }).format(cell),
  },
  {
    text: "member",
    dataField: "memberNumber",
    sort: true,
    formatter: (cell) =>
      cell &&
      new Intl.NumberFormat("en", {
        notation: "compact",
      }).format(cell),
  },
  {
    text: "Jobs",
    dataField: "jobsNumber",
    sort: true,
    formatter: (cell) =>
      cell &&
      new Intl.NumberFormat("en", {
        notation: "compact",
      }).format(cell),
  },
  {
    text: "description",
    dataField: "description",
    formatter: (cell) => <div style={{ maxWidth: 300 }}>{cell}</div>,
  },
];

export default function CorporationIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [corporations, setCorporations] = useState([]);
  // const [ifSortByRenvue, setIfSortByRevnue] = useState(false);
  const [prevRange, setPrevRange] = useState({});
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    async function effectQuery() {
      const newCorporations = [];
      let totalJobs = 0;

      try {
        getDocs(corporationRef)
          .then((querySnapshot) => {
            setTotal(querySnapshot.size);
          })
          .catch((error) => {
            console.error(error);
          });
        const q = query(corporationRef, limit(ITEM_SIZE_PER_PAGE));
        const docSnapshots = await getDocs(q);
        setPrevRange({
          ...prevRange,
          [page]: [
            docSnapshots.docs[0],
            docSnapshots.docs[docSnapshots.docs.length - 1],
          ],
        });
        // console.log("docSnapshots.docs()", docSnapshots.docs());

        docSnapshots.forEach((doc) => {
          const data = doc.data();
          newCorporations.push({
            id: doc.id,
            ...data,
          });
          if (typeof data.jobsNumber !== "undefined")
            totalJobs += data.jobsNumber;
        });
      } catch (e) {
        console.error(e);
        setError(e);
      }
      console.log("newCorporations", newCorporations);
      setCorporations(newCorporations);
      setIsLoading(false);
      setTotalJobs(totalJobs);
    }
    effectQuery();
  }, []);

  const handleNextClick = () => {
    const newCorporations = [];

    const q = query(
      corporationRef,
      orderBy("revenue", "desc"),
      startAfter(prevRange[page][1]),
      limit(ITEM_SIZE_PER_PAGE)
    );

    getDocs(q)
      .then((docSnapshots) => {
        setPrevRange({
          ...prevRange,
          [page + 1]: [
            docSnapshots.docs[0],
            docSnapshots.docs[docSnapshots.docs.length - 1],
          ],
        });
        if (!docSnapshots.empty) {
          docSnapshots.forEach((doc) => {
            newCorporations.push(doc.data());
          });
          setCorporations(newCorporations);
          setPage((page) => ++page);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const handlePrevClick = async () => {
    const newCorporations = [];
    const q = query(
      corporationRef,
      orderBy("revenue", "desc"),
      startAt(prevRange[page - 1][0]),
      endAt(prevRange[page - 1][1]),
      limit(ITEM_SIZE_PER_PAGE)
    );
    const docSnapshots = await getDocs(q);
    docSnapshots.forEach((doc) => {
      newCorporations.push(doc.data());
    });
    setCorporations(newCorporations);
    setPage((page) => --page);
  };

  const results = corporations.filter((board) =>
    phrase ? board.name.match(new RegExp(phrase, "i")) : true
  );

  // const results = useMemo(
  //   () =>
  //     ifSortByRenvue
  //       ? filteredCopoerations.sort((a, b) => b.revenue - a.revenue)
  //       : filteredCopoerations,
  //   [ifSortByRenvue, filteredCopoerations]
  // );

  return (
    <div>
      <h2>Corporations</h2>
      <div className="h3">
        Total Jobs:{" "}
        {new Intl.NumberFormat("en", {
          notation: "compact",
        }).format(totalJobs)}
      </div>
      <div className="d-flex justify-content-between">
        <div>
          Page: {page} / {Math.floor(total / ITEM_SIZE_PER_PAGE)}
          {/* | Sort by{" "}
          <button
            onClick={() => setIfSortByRevnue(!ifSortByRenvue)}
            className={classNames(
              "btn",
              !ifSortByRenvue ? "btn-outline-dark" : "btn-dark"
            )}
          >
            Revenue
          </button> */}
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
        <div className="row my-3">
          {results.length ? (
            <BootstrapTable
              keyField="id"
              data={corporations}
              columns={columns}
            />
          ) : (
            "empty content"
          )}
        </div>
      )}
      {/* <h3>Reference</h3>
      <a href="https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/">
        https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/
      </a> */}
    </div>
  );
}
