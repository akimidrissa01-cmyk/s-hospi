import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">HospitalSys</h2>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="sidebar-link">
          Dashboard
        </NavLink>
        <NavLink to="/patients" className="sidebar-link">
          Patients
        </NavLink>
        <NavLink to="/consultations" className="sidebar-link">
          Consultations
        </NavLink>
        <NavLink to="/prescriptions" className="sidebar-link">
          Prescriptions
        </NavLink>
        <NavLink to="/laboratory" className="sidebar-link">
          Laboratory
        </NavLink>
        <NavLink to="/pharmacy" className="sidebar-link">
          Pharmacy
        </NavLink>
        <NavLink to="/billing" className="sidebar-link">
          Billing
        </NavLink>
        <NavLink to="/reports" className="sidebar-link">
          Reports
        </NavLink>
        

      </nav>
    </aside>
  );
};

export default Sidebar;
