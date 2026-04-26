import { BrowserRouter, Routes, Route } from "react-router-dom";
import DataSources from "./pages/DataSources";
import CongressUpload from "./pages/CongressUpload";
import CongressMapping from "./pages/CongressMapping";
import Projects from "./pages/Projects";
import Profiles from "./pages/Profiles";
import ConflictResolution from "./pages/ConflictResolution";
import HcpDetail from "./pages/HcpDetail";
import HospitalDetail from "./pages/HospitalDetail";
import MetricLibrary from "./pages/MetricLibrary";
import OpportunityCreation from "./pages/OpportunityCreation";
import DomainDefinition from "./pages/DomainDefinition";
import AdoptionLadderConfig from "./pages/AdoptionLadderConfig";
import LeadingBoard from "./pages/LeadingBoard";
import ScoreConfiguration from "./pages/ScoreConfiguration";
import Campaigns from "./pages/Campaigns";
import ProjectDetail from "./pages/ProjectDetail";
import AnonymousLeadDetail from "./pages/AnonymousLeadDetail";
import PharmacistDetail from "./pages/PharmacistDetail";
import Products from "./pages/Products";
import UploadMapping from "./pages/UploadMapping";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DataSources />} />
        <Route path="/domain-definition" element={<DomainDefinition />} />
        <Route path="/adoption-ladder" element={<AdoptionLadderConfig />} />
        <Route path="/metric-library" element={<MetricLibrary />} />
        <Route path="/upload/congress" element={<CongressUpload />} />
        <Route path="/upload/congress/mapping" element={<CongressMapping />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/profiles/conflict" element={<ConflictResolution />} />
        <Route path="/profiles/hcp/:id" element={<HcpDetail />} />
        <Route path="/profiles/hospital/:id" element={<HospitalDetail />} />
        <Route path="/profiles/lead-signal/:id" element={<AnonymousLeadDetail />} />
        <Route path="/profiles/pharmacist/:id" element={<PharmacistDetail />} />
        <Route path="/leading-board" element={<LeadingBoard />} />
        <Route path="/leading-board/score-configuration" element={<ScoreConfiguration />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/upload/mapping" element={<UploadMapping />} />
      </Routes>
    </BrowserRouter>
  );
}
