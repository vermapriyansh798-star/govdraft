import { Link } from "react-router-dom";
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
    </nav>
  );
}

