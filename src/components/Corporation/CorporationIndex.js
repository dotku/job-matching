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
import { Button, Modal } from "react-bootstrap";
import styled from "styled-components";
import PayPalButton from "../common/PaypalButton";
import PaypalModal from "../common/PaypalModal";
import PayPalModal from "../common/PaypalModal";
import WithErrorContent from "../common/WithErrorContent";
import { CorporationCard } from "./CorporationCard";
import { corporationRef } from "./CorporationJobBoards";

const ITEM_SIZE_PER_PAGE = 12;
const StyledButton = styled.button`
  &.btn-outline-dark {
    border-color: #212529;
  }
  &.btn-outline-dark:disabled {
    border-color: #6c757d;
  }
  &.btn-outline-dark:hover {
    color: white;
  }
`;

export default function CorporationIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [corporations, setCorporations] = useState([]);
  // const [ifSortByRenvue, setIfSortByRevnue] = useState(false);
  const [prevRange, setPrevRange] = useState({});
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

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
        const docSnapshots = await getDocs(q);
        setPrevRange({
          ...prevRange,
          [page]: [
            docSnapshots.docs[0],
            docSnapshots.docs[docSnapshots.docs.length - 1],
          ],
        });
        docSnapshots.forEach((doc) => {
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

  const handlePayPalModalClose = () => {
    setShowPayPalModal(false);
  };

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
          <StyledButton
            className="btn btn-outline-dark ms-1"
            onClick={handlePrevClick}
            disabled={page <= 1}
          >
            Prev
          </StyledButton>

          <StyledButton
            className="btn btn-outline-dark ms-1"
            onClick={() => setShowPayPalModal(true)}
            disabled={page >= Math.floor(total / ITEM_SIZE_PER_PAGE)}
          >
            Next
          </StyledButton>
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
      <PaypalModal
        show={showPayPalModal}
        handleClose={handlePayPalModalClose}
      />

      {/* <h3>Reference</h3>
      <a href="https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/">
        https://companiesmarketcap.com/professional-services/largest-professional-service-companies-by-market-cap/
      </a> */}
    </div>
  );
}
