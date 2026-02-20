import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import api from "../api/axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    consultations: 0,
    prescriptions: 0,
    laboratory: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, consultationsRes, prescriptionsRes, labRes] = 
          await Promise.all([
            api.get("patients/"),
            api.get("consultations/"),
            api.get("prescriptions/"),
            api.get("laboratory/"),
          ]);

        setStats({
          patients: patientsRes.data.length,
          consultations: consultationsRes.data.length,
          prescriptions: prescriptionsRes.data.length,
          laboratory: labRes.data.length,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Erreur lors du chargement des données");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <Sidebar />
        <Navbar />
        <div className="dashboard-content">
          <h1>Dashboard</h1>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Sidebar />
        <Navbar />
        <div className="dashboard-content">
          <h1>Dashboard</h1>
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />
      <Navbar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <div className="cards-container">
          <Card title="Patients" value={stats.patients} />
          <Card title="Consultations" value={stats.consultations} />
          <Card title="Prescriptions" value={stats.prescriptions} />
          <Card title="Laboratory Tests" value={stats.laboratory} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

