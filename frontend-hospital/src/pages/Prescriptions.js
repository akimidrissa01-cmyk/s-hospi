import React, { useState, useEffect, useContext, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./Prescriptions.css";

/**
 * ==========================
 * PAGE PRESCRIPTIONS
 * CRUD complet avec API Django
 * Sécurisé par JWT
 * ==========================
 */

const Prescriptions = () => {
  const { user, token } = useContext(AuthContext);

  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);

  const [formData, setFormData] = useState({
    consultation: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await api.get("prescriptions/");
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Erreur récupération prescriptions :", err);
    }
  }, []);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await api.get("consultations/");
      setConsultations(res.data);
    } catch (err) {
      console.error("Erreur récupération consultations :", err);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data);
    } catch (err) {
      console.error("Erreur récupération patients :", err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchPrescriptions();
      fetchConsultations();
      fetchPatients();
    }
  }, [token, fetchPrescriptions, fetchConsultations, fetchPatients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`prescriptions/${editId}/`, formData);
      } else {
        await api.post("prescriptions/", formData);
      }

      setFormData({
        consultation: "",
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });

      setEditId(null);
      setShowForm(false);
      fetchPrescriptions();
    } catch (err) {
      console.error("Erreur sauvegarde prescription :", err);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      consultation: p.consultation,
      medication: p.medication,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await api.delete(`prescriptions/${id}/`);
      fetchPrescriptions();
    } catch (err) {
      console.error("Erreur suppression prescription :", err);
    }
  };

  const getPatientName = (consultationId) => {
    const c = consultations.find(c => c.id === consultationId);
    if (c) {
      const p = patients.find(p => p.id === c.patient);
      return p ? `${p.first_name} ${p.last_name}` : "-";
    }
    return "-";
  };

  const getConsultationDate = (consultationId) => {
    const c = consultations.find(c => c.id === consultationId);
    return c?.date ? c.date.slice(0, 10) : "-";
  };

  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="prescriptions-container">
        <h1>Gestion des Prescriptions</h1>

        {["admin", "doctor"].includes(user?.role) && (
          <div className="fab-container">
            <button className="fab" onClick={() => setShowForm(!showForm)}>
              {showForm ? "×" : "+"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="form-container">
            <h2>{editId ? "Modifier la prescription" : "Ajouter une prescription"}</h2>

            <form className="prescription-form" onSubmit={handleSubmit}>

              <div className="form-section">
                <h3>Consultation</h3>
                <select
                  required
                  value={formData.consultation}
                  onChange={(e) =>
                    setFormData({ ...formData, consultation: e.target.value })
                  }
                >
                  <option value="">Sélectionner une consultation</option>
                  {consultations.map((c) => {
                    const patient = patients.find(p => p.id === c.patient);
                    return (
                      <option key={c.id} value={c.id}>
                        {patient
                          ? `${patient.first_name} ${patient.last_name}`
                          : `Consultation #${c.id}`
                        } — {c.date?.slice(0, 10)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-section">
                <h3>Détails du médicament</h3>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Médicament"
                    value={formData.medication}
                    onChange={(e) =>
                      setFormData({ ...formData, medication: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dosage (ex: 500mg)"
                    value={formData.dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Fréquence (ex: 3 fois/jour)"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Durée (ex: 7 jours)"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Instructions</h3>
                <textarea
                  placeholder="Instructions complémentaires"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                />
              </div>

              <div className="form-actions">
                <button className="edit-btn" type="submit">
                  {editId ? "Modifier" : "Ajouter"}
                </button>
              </div>

            </form>
          </div>
        )}

        <table className="prescriptions-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Médicament</th>
              <th>Dosage</th>
              <th>Fréquence</th>
              <th>Durée</th>
              <th>Instructions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((p) => (
              <tr key={p.id}>
                <td>{getPatientName(p.consultation)}</td>
                <td>{getConsultationDate(p.consultation)}</td>
                <td>{p.medication}</td>
                <td>{p.dosage}</td>
                <td>{p.frequency}</td>
                <td>{p.duration}</td>
                <td>{p.instructions || "-"}</td>
                <td>
                  {["admin", "doctor"].includes(user?.role) && (
                    <>
                      <button className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prescriptions;
