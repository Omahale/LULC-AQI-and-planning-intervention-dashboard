import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import AQIAnalytics from "./pages/AQIAnalytics";
import LULCAnalytics from "./pages/LULCAnalytics";
import Hotspots from "./pages/Hotspots";
import Prediction from "./pages/Prediction";
import Trends from "./pages/Trends";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import About from "./pages/About";

import { authStorage } from "./services/api";

import "./styles/global.css";

const routeDefinitions = [
  { path: "/", element: <Dashboard />, roles: ["citizen", "engineer", "admin"] },
  { path: "/map", element: <MapPage />, roles: ["citizen", "engineer", "admin"] },
  { path: "/aqi", element: <AQIAnalytics />, roles: ["citizen", "engineer", "admin"] },
  { path: "/lulc", element: <LULCAnalytics />, roles: ["citizen", "engineer", "admin"] },
  { path: "/hotspots", element: <Hotspots />, roles: ["citizen", "admin"] },
  { path: "/prediction", element: <Prediction />, roles: ["admin"] },
  { path: "/trends", element: <Trends />, roles: ["citizen", "admin"] },
  { path: "/alerts", element: <Alerts />, roles: ["admin"] },
  { path: "/reports", element: <Reports />, roles: ["engineer", "admin"] },
  { path: "/about", element: <About />, roles: ["citizen", "engineer", "admin"] },
];

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = authStorage.getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const user = authStorage.getUser();
  const role = user?.role || "citizen";

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppShell() {
  return (
    <div className="app-layout">
      <div className="main-section">
        <Navbar />

        <main className="content">
          <Routes>
            {routeDefinitions.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <RoleGuard allowedRoles={route.roles}>
                    {route.element}
                  </RoleGuard>
                }
              />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;