import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import Launchpad from "./pages/Launchpad";
import DprGeneration from "./pages/DprGeneration";
import FinanceTriage from "./pages/FinanceTriage";
import RfpManagement from "./pages/RfpManagement";
import BidderPortal from "./pages/BidderPortal";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Launchpad />} />
          <Route path="/dpr" element={<DprGeneration />} />
          <Route path="/finance" element={<FinanceTriage />} />
          <Route path="/rfp" element={<RfpManagement />} />
          <Route path="/bidder" element={<BidderPortal />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
