import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="navbar">
        <br></br>
   
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default Navbar;
