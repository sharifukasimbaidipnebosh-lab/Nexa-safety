async function fetchLiveFlights() {
  // temporary mock data (until real API is connected)
  return [
    {
      flight: "EK202",
      airline: "Emirates",
      lat: 25.2532,
      lng: 55.3657
    },
    {
      flight: "QR101",
      airline: "Qatar Airways",
      lat: 25.276987,
      lng: 51.520008
    }
  ];
}

module.exports = { fetchLiveFlights };