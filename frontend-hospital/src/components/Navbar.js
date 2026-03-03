import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users from API
  useEffect(() => {
    const fetchUsers = async () => {
      if (token) {
        try {
          const res = await axios.get("http://127.0.0.1:8000/api/accounts/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAllUsers(res.data);
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      }
    };
    fetchUsers();
  }, [token]);

  const handleToggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Get other users (exclude current user)
  const otherUsers = allUsers.filter((u) => u.id !== user?.id);

  // Get first letter of username for avatar
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : "?";
  };

  // Check if user is recently active (within last 5 minutes)
  const isRecentlyActive = (lastLogin) => {
    if (!lastLogin) return false;
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffMinutes = (now - lastLoginDate) / (1000 * 60);
    return diffMinutes <= 5;
  };

  return (
    <div className="navbar">
      <div className="user-info" onClick={handleToggleMenu}>
        <div className="user-avatar">
          {user?.username ? getInitials(user.username) : "?"}
        </div>
        <span className="user-name">{user?.username || "User"}</span>
      </div>

      {menuOpen && (
        <div className="dropdown-menu" onClick={handleClose}>
          {/* Current User Section */}
          <div className="menu-section current-user">
            <div className="menu-label">Connecté en tant que</div>
            <div className="current-user-info">
              {user?.username} ({user?.role})
            </div>
          </div>

          <div className="menu-divider"></div>

          {/* Other Connected Users */}
          <div className="menu-section">
            <div className="menu-label">AUTRES UTILISATEURS</div>
            {otherUsers.length > 0 ? (
              otherUsers.map((u) => (
                <div key={u.id} className="other-user">
                  <div className="other-user-avatar-wrapper">
                    <div className="other-user-avatar">
                      {getInitials(u.username)}
                    </div>
                    <div
                      className={`status-indicator ${
                        isRecentlyActive(u.last_login) ? "online" : "offline"
                      }`}
                      title={
                        isRecentlyActive(u.last_login)
                          ? "En ligne"
                          : "Hors ligne"
                      }
                    ></div>
                  </div>
                  <div className="other-user-info">
                    <span className="other-username">{u.username}</span>
                    <span className="other-role">{u.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-users">Aucun autre utilisateur</div>
            )}
          </div>

          <div className="menu-divider"></div>

          {/* Logout Option */}
          <div className="menu-item logout" onClick={handleLogout}>
            Déconnexion
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
