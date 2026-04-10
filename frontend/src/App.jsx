import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SetupAccount from "./pages/SetupAccount";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import BystanderSOS from "./pages/BystanderSOS";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-account" element={<SetupAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/report" element={<BystanderSOS />} />
      </Routes>
    </BrowserRouter>
  );
}

