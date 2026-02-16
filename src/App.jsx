import { BrowserRouter, Routes, Route } from "react-router-dom";
import DataSources from "./pages/DataSources";
import CongressUpload from "./pages/CongressUpload";
import CongressMapping from "./pages/CongressMapping";
import Projects from "./pages/Projects";
import Profiles from "./pages/Profiles";
import ConflictResolution from "./pages/ConflictResolution";
import HcpDetail from "./pages/HcpDetail";
import HospitalDetail from "./pages/HospitalDetail";
import GoalTracking from "./pages/GoalTracking";
import OpportunityCreation from "./pages/OpportunityCreation";
import DomainDefinition from "./pages/DomainDefinition";
import AdoptionLadderConfig from "./pages/AdoptionLadderConfig";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DataSources />} />
        <Route path="/domain-definition" element={<DomainDefinition />} />
        <Route path="/adoption-ladder" element={<AdoptionLadderConfig />} />
        <Route path="/goal-tracking" element={<GoalTracking />} />
        <Route path="/goal-tracking/opportunity-creation" element={<OpportunityCreation />} />
        <Route path="/upload/congress" element={<CongressUpload />} />
        <Route path="/upload/congress/mapping" element={<CongressMapping />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/profiles/conflict" element={<ConflictResolution />} />
        <Route path="/profiles/hcp/:id" element={<HcpDetail />} />
        <Route path="/profiles/hospital/:id" element={<HospitalDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
