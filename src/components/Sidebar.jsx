import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Map,
  Activity,
  Trees,
  Flame,
  Brain,
  TrendingUp,
  Bell,
  FileText,
  Info,
  Leaf,
} from "lucide-react";

export const ROLE_PERMISSIONS = {
  citizen: ["/", "/map", "/aqi", "/lulc", "/hotspots", "/trends", "/about"],
  engineer: ["/", "/map", "/aqi", "/lulc", "/reports", "/about"],
  admin: ["/", "/map", "/aqi", "/lulc", "/hotspots", "/prediction", "/trends", "/alerts", "/reports", "/about"],
};

export const menuItems = [
  {
    name: "Overview",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "LULC & AQI Map",
    path: "/map",
    icon: Map,
  },
  {
    name: "Pollution Hotspot Analysis",
    path: "/aqi",
    icon: Activity,
  },
  {
    name: "LULC Analytics",
    path: "/lulc",
    icon: Trees,
  },
  {
    name: "Intervention Ranking",
    path: "/hotspots",
    icon: Flame,
  },
  {
    name: "AQI Prediction",
    path: "/prediction",
    icon: Brain,
  },
  {
    name: "Environmental Trends",
    path: "/trends",
    icon: TrendingUp,
  },
  {
    name: "Alerts",
    path: "/alerts",
    icon: Bell,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "About",
    path: "/about",
    icon: Info,
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo-section">
        <div className="logo-icon">
          <Leaf size={24} />
        </div>

        <div>
          <h2>LULC-AQI</h2>
          <span>Environmental Monitor</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>

        <div>
          <strong>System Online</strong>
          <span>Nashik Environmental Monitoring</span>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;