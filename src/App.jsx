import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import EventStage from "./pages/EventStage";
import Badges from "./pages/Badges";
import AgileProject from "./pages/AgileProject";
import ProtectedRoute from "./components/ProtectedRoute";
import MissionDetails from "./pages/MissionDetails";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMissions from "./pages/AdminMissions";
import CreateMission from "./pages/CreateMission";
import EditMission from "./pages/EditMission";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminSubmissionDetails from "./pages/AdminSubmissionDetails";
import AdminAIStudio from "./pages/AdminAIStudio";
import AdminBadges from "./pages/AdminBadges";
import AdminEvents from "./pages/AdminEvents";
import IntelligenceTest from "./pages/IntelligenceTest";

function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/missions/:missionId" element={<MissionDetails />} />
    <Route path="/intelligence-test" element={<IntelligenceTest />} />
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/missions" element={<AdminMissions />} />
      <Route path="/admin/missions/new" element={<CreateMission />} />
      <Route path="/admin/missions/:missionId/edit" element={<EditMission />} />
      <Route path="/admin/submissions" element={<AdminSubmissions />} />
      <Route path="/admin/submissions/:submissionId" element={<AdminSubmissionDetails />} />
      <Route path="/admin/ai" element={<AdminAIStudio />} />
      <Route path="/admin/badges" element={<AdminBadges />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/agile" element={<AgileProject />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/missions" element={<Missions />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:eventId/stage/:stageId" element={<EventStage />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
  </Routes>;
}
export default App;
