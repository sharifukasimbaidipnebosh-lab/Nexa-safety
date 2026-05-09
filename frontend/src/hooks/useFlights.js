import { useEffect, useState } from "react";
import { getFlights } from "../api/flightsAPI";

const useFlights = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFlights = async () => {
    try {
      const data = await getFlights();
      setFlights(data || []);
    } catch (err) {
      console.error("Flight load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();

    const interval = setInterval(loadFlights, 15000); // auto refresh

    return () => clearInterval(interval);
  }, []);

  return { flights, loading };
};

export default useFlights;