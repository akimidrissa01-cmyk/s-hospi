import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import axios from "../api/axios";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // 🔹 Fetch all users from API, refresh every 10 sec
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        const res = await axios.get("/accounts/"); // endpoint Django
        setAllUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers(); // initial fetch
    const interval = setInterval(fetchUsers, 10000); // refresh toutes les 10 secondes
    return () => clearInterval(interval);
  }, [token]);

  const handleToggleMenu = () => setMenuOpen(!menuOpen);
  const handleClose = () => setMenuOpen(false);
  const handleLogout = () => {
    handleClose();
    logout();
  };

  // 🔹 Exclude current user
  const otherUsers = allUsers.filter((u) => u.id !== user?.id);

  // 🔹 Initiales pour avatar
  const getInitials = (username) => (username ? username.charAt(0).toUpperCase() : "?");

  // 🔹 Statut en ligne basé sur last_seen
  const isRecentlyActive = (lastSeen) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);
    return diffMinutes <= 5; // considéré actif si dernière activité < 5 min
  };

  return (
    <div className="navbar">
      {/* Utilisateur courant */}
      <div className="user-info" onClick={handleToggleMenu}>
        <div className="user-avatar">{getInitials(user?.username)}</div>
        <span className="user-name">{user?.username || "User"}</span>
      </div>

      {/* Menu déroulant */}
      {menuOpen && (
        <div className="dropdown-menu" onClick={handleClose}>
          {/* Utilisateur connecté */}
          <div className="menu-section current-user">
            <div className="menu-label">Connecté en tant que</div>
            <div className="current-user-info">
              {user?.username} ({user?.role})
            </div>
          </div>

          <div className="menu-divider"></div>

          {/* Autres utilisateurs */}
          <div className="menu-section">
            <div className="menu-label">AUTRES UTILISATEURS</div>
            {otherUsers.length > 0 ? (
              otherUsers.map((u) => (
                <div key={u.id} className="other-user">
                  <div className="other-user-avatar-wrapper">
                    <div className="other-user-avatar">{getInitials(u.username)}</div>
                    <div
                      className={`status-indicator ${
                        isRecentlyActive(u.last_seen) ? "online" : "offline"
                      }`}
                      title={isRecentlyActive(u.last_seen) ? "En ligne" : "Hors ligne"}
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

          {/* Déconnexion */}
          <div className="menu-item logout" onClick={handleLogout}>
            Déconnexion
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
