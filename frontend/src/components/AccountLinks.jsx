import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AccountLinks() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="nav-auth">
        <span>{user.full_name}</span>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="nav-auth">
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </div>
  );
}

export default AccountLinks;