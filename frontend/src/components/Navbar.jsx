import { Link, NavLink } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">
          <Shield size={20} />
        </div>
        <span>GovDraft</span>
        <span className="state-badge">Govt. of Uttarakhand</span>
      </Link>

      <ul className="navbar-links">
        <li>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Launchpad
          </NavLink>
        </li>
        <li>
          <NavLink to="/dpr" className={({ isActive }) => (isActive ? "active" : "")}>
            DPR Generation
          </NavLink>
        </li>
        <li>
          <NavLink to="/finance" className={({ isActive }) => (isActive ? "active" : "")}>
            Finance Triage
          </NavLink>
        </li>
        <li>
          <NavLink to="/rfp" className={({ isActive }) => (isActive ? "active" : "")}>
            RFP Management
          </NavLink>
        </li>
        <li>
          <NavLink to="/bidder" className={({ isActive }) => (isActive ? "active" : "")}>
            Bidder Portal
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
