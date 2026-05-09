import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardHome from "./pages/DashboardHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;