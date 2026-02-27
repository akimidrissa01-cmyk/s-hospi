import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import api from "../api/axios";
import "./Dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ['#4ea8de', '#82e9de', '#a8dadc', '#457b9d', '#e9c46a', '#f4a261'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("month");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("reports/dashboard-stats/");
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Erreur lors du chargement des données");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const getActivityIcon = (type) => {
    const icons = {
      patient: "👤",
      consultation: "🩺",
      laboratory: "🔬",
      prescription: "📝",
      billing: "💰",
    };
    return icons[type] || "📋";
  };

  const getActivityColor = (type) => {
    const colors = {
      patient: "#4ea8de",
      consultation: "#82e9de",
      laboratory: "#a8dadc",
      prescription: "#457b9d",
      billing: "#e9c46a",
    };
    return colors[type] || "#888";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Prepare chart data
  const getChartData = () => {
    if (!dashboardData?.charts) return [];
    const { months, patients, consultations, lab_tests } = dashboardData.charts;
    return months.map((month, index) => ({
      name: month,
      patients: patients[index] || 0,
      consultations: consultations[index] || 0,
      lab_tests: lab_tests[index] || 0,
    }));
  };

  // Prepare pie chart data
  const getPieData = () => {
    if (!dashboardData?.totals) return [];
    const { patients, consultations, lab_tests, prescriptions, bills } = dashboardData.totals;
    return [
      { name: "Patients", value: patients, color: "#4ea8de" },
      { name: "Consultations", value: consultations, color: "#82e9de" },
      { name: "Lab Tests", value: lab_tests, color: "#a8dadc" },
      { name: "Prescriptions", value: prescriptions, color: "#457b9d" },
      { name: "Factures", value: bills, color: "#e9c46a" },
    ];
  };

  if (loading && !dashboardData) {
    return (
      <div>
        <Sidebar />
        <Navbar />
        <div className="dashboard-content">
          <h1>Dashboard</h1>
          <p className="loading">Chargement des données...</p>
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

  const totals = dashboardData?.totals || {};
  const pieData = getPieData();
  const chartData = getChartData();

  return (
    <div>
      <Sidebar />
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="cards-container">
          <Card title="Patients" value={totals.patients || 0} />
          <Card title="Consultations" value={totals.consultations || 0} />
          <Card title="Prescriptions" value={totals.prescriptions || 0} />
          <Card title="Laboratory Tests" value={totals.lab_tests || 0} />
          <Card title="Factures" value={totals.bills || 0} />
          <Card title="Factures en attente" value={totals.pending_bills || 0} />
        </div>

        {/* Charts Section */}
        {dashboardData && (
          <>
            {/* Charts Row */}
            <div className="charts-row">
              {/* Monthly Activity Bar Chart */}
              <div className="chart-container">
                <h3>Activité Mensuelle (6 derniers mois)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#c0c0c0" />
                    <YAxis stroke="#c0c0c0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e2f",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="patients"
                      name="Patients"
                      fill="#4ea8de"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="consultations"
                      name="Consultations"
                      fill="#82e9de"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="lab_tests"
                      name="Laboratoire"
                      fill="#a8dadc"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Breakdown Pie Chart */}
              <div className="chart-container">
                <h3>Répartition des Activités</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e2f",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity History Table */}
            <div className="history-section">
              <h3>📋 Historique des Activités Récentes</h3>
              <div className="history-table-container">
                {dashboardData.recent_activities && dashboardData.recent_activities.length > 0 ? (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Activité</th>
                        <th>Détails</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recent_activities.map((activity, index) => (
                        <tr key={index}>
                          <td>
                            <span
                              className="activity-type"
                              style={{ backgroundColor: getActivityColor(activity.type) }}
                            >
                              {getActivityIcon(activity.type)}
                            </span>
                          </td>
                          <td>{activity.action}</td>
                          <td>{activity.details}</td>
                          <td className="date-cell">{formatDate(activity.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-activities">Aucune activité récente</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
