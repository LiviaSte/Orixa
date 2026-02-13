import { BrowserRouter, Routes, Route } from "react-router-dom";
import DataSources from "./pages/DataSources";
import CongressUpload from "./pages/CongressUpload";
import CongressMapping from "./pages/CongressMapping";
import Projects from "./pages/Projects";
import Profiles from "./pages/Profiles";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DataSources />} />
        <Route path="/upload/congress" element={<CongressUpload />} />
        <Route path="/upload/congress/mapping" element={<CongressMapping />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/profiles" element={<Profiles />} />
      </Routes>
    </BrowserRouter>
  );
}
