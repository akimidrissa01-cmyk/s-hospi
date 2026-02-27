import React, { useState, useEffect, useContext, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./Reports.css";

const Reports = () => {
  const { user } = useContext(AuthContext);

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    patient: "",
    report_type: "consultation",
    title: "",
    content: "",
  });

  const [filters, setFilters] = useState({
    report_type: "",
    patient: "",
    start_date: "",
    end_date: "",
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.report_type) params.append("report_type", filters.report_type);
      if (filters.patient) params.append("patient", filters.patient);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const queryString = params.toString();
      const url = queryString ? `reports/?${queryString}` : "reports/";
      
      const res = await api.get(url);
      setReports(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Erreur lors du chargement des rapports");
      setLoading(false);
    }
  }, [filters]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchPatients();
  }, [fetchReports, fetchPatients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const reportData = {
        ...formData,
        patient: formData.patient ? parseInt(formData.patient) : null,
      };

      if (editId) {
        await api.put(`reports/${editId}/`, reportData);
      } else {
        await api.post("reports/", reportData);
      }

      setFormData({
        patient: "",
        report_type: "consultation",
        title: "",
        content: "",
      });
      
      setEditId(null);
      setShowForm(false);
      fetchReports();
    } catch (err) {
      console.error("Error saving report:", err);
      setError("Erreur lors de l'enregistrement du rapport");
    }
  };

  const handleEdit = (report) => {
    setFormData({
      patient: report.patient || "",
      report_type: report.report_type,
      title: report.title,
      content: report.content,
    });
    setEditId(report.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await api.delete(`reports/${id}/`);
      fetchReports();
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const getPatientName = (patientId) => {
    if (!patientId) return "—";
    const p = patients.find(x => x.id === patientId);
    return p ? `${p.first_name} ${p.last_name}` : "—";
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      consultation: "Consultation",
      lab: "Laboratoire",
      billing: "Facturation",
      pharmacy: "Pharmacie",
    };
    return labels[type] || type;
  };

  const getReportTypeColor = (type) => {
    const colors = {
      consultation: "#4ea8de",
      lab: "#a8dadc",
      billing: "#e9c46a",
      pharmacy: "#82e9de",
    };
    return colors[type] || "#888";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="reports-container">
        <h1>Gestion des Rapports</h1>

        {/* Filters Section */}
        <div className="filters-section">
          <h3>Filtres</h3>
          <div className="filters-row">
            <div className="filter-group">
              <label>Type de rapport</label>
              <select
                value={filters.report_type}
                onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
              >
                <option value="">Tous les types</option>
                <option value="consultation">Consultation</option>
                <option value="lab">Laboratoire</option>
                <option value="billing">Facturation</option>
                <option value="pharmacy">Pharmacie</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Patient</label>
              <select
                value={filters.patient}
                onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
              >
                <option value="">Tous les patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date début</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Date fin</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>

            <button className="filter-btn" onClick={fetchReports}>
              Appliquer
            </button>
          </div>
        </div>

        {/* Add Button - Only Admin can create reports */}
        {["admin", "doctor"].includes(user?.role) && (
          <div className="fab-container">
            <button className="fab" onClick={() => setShowForm(!showForm)}>
              +
            </button>
          </div>
        )}

        {/* Report Form */}
        {showForm && (
          <div className="form-container">
            <h2>{editId ? "Modifier le rapport" : "Nouveau rapport"}</h2>

            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label>Patient</label>
                <select
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                >
                  <option value="">Sélectionner un patient (optionnel)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type de rapport</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="lab">Laboratoire</option>
                  <option value="billing">Facturation</option>
                  <option value="pharmacy">Pharmacie</option>
                </select>
              </div>

              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  placeholder="Titre du rapport"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Contenu</label>
                <textarea
                  placeholder="Contenu du rapport..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setFormData({
                      patient: "",
                      report_type: "consultation",
                      title: "",
                      content: "",
                    });
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="edit-btn">
                  {editId ? "Mettre à jour" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Table */}
        {loading ? (
          <p className="loading">Chargement des rapports...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : reports.length === 0 ? (
          <p className="no-data">Aucun rapport trouvé</p>
        ) : (
          <div className="table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Patient</th>
                  <th>Généré par</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span
                        className="report-type-badge"
                        style={{ backgroundColor: getReportTypeColor(report.report_type) }}
                      >
                        {getReportTypeLabel(report.report_type)}
                      </span>
                    </td>
                    <td>{report.title}</td>
                    <td>{getPatientName(report.patient)}</td>
                    <td>{report.generated_by_name || "—"}</td>
                    <td>{formatDate(report.generated_at)}</td>
                    <td>
                      {["admin", "doctor"].includes(user?.role) && (
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(report)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(report.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
