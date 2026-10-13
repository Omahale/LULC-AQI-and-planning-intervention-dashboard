import { NavLink, useNavigate } from "react-router-dom";

import {
  Bell,
  Search,
  UserCircle,
  Leaf,
  LogOut,
} from "lucide-react";

import { menuItems, ROLE_PERMISSIONS } from "./Sidebar";
import { authStorage } from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const user = authStorage.getUser();
  const role = user?.role || "citizen";
  const visibleMenuItems = menuItems.filter((item) =>
    (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.citizen).includes(item.path)
  );

  const handleLogout = () => {
    authStorage.clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">

      <div className="header-top-row">
        <div className="brand-block">
          <div className="logo-icon">
            <Leaf size={20} />
          </div>

          <div className="brand-copy">
            <strong>LULC-AQI</strong>
            <span>Environmental Monitor</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search location, pollutant..."
            />
          </div>

          <button className="icon-button" type="button">
            <Bell size={19} />
            <span className="notification-dot"></span>
          </button>

          <div className="user-profile">
            <UserCircle size={32} />

            <div>
              <strong>{user?.name || "Environmental Admin"}</strong>
              <span>{user?.role || "Nashik NMC"}</span>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <nav className="top-nav" aria-label="Main navigation">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `top-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

    </header>
  );
}

export default Navbar;