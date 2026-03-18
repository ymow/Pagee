import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ReaderPage from "./pages/ReaderPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/reader/:id" element={<ReaderPage />} />
      </Routes>
    </Router>
  );
}

export default App;
