import { getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import WithErrorContent from "../common/WithErrorContent";
import { CorporationCard } from "./CorporationCard";
import { corporationRef } from "./CorporationJobBoards";

export default function CorperationIndex({ phrase }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [corporations, setCorporations] = useState([]);

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

  const results = corporations
    .filter((board) =>
      phrase ? board.name.match(new RegExp(phrase, "i")) : true
    )
    .sort((a, b) => b.revenue - a.revenue)

  return <div>
    <h2>Corporations</h2>
    {isLoading ? (
      <div>Loading ...</div>
    ) : (
      // <WithErrorContent error={error}>
      <div className="row my-3">
        {results.length ? results.map(({
          name,
          url,
          candidatesNumber,
          jobsNumber,
          corporationNumber,
          memberNumber,
          revenue,
        }, idx) => <CorporationCard {...{
          name,
          url,
          candidatesNumber,
          jobsNumber,
          corporationNumber,
          memberNumber,
          revenue,
        }} key={idx} />) : "empty content"}
      </div>
      // </WithErrorContent>
    )}
  </div>
}