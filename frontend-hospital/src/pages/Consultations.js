import React, { useState, useEffect, useContext, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./Consultation.css";

const Consultations = () => {
  const { user, token } = useContext(AuthContext);

  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [showVisits, setShowVisits] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    date: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await api.get("consultations/");
      setConsultations(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get("accounts/");
      setDoctors(res.data.filter(u => u.role === "doctor"));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchVisitsInProgress = useCallback(async () => {
    try {
      const res = await api.get("patients/visits/in-progress/");
      setVisits(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchConsultations();
      fetchPatients();
      fetchDoctors();
      fetchVisitsInProgress();
    }
  }, [token, fetchConsultations, fetchPatients, fetchDoctors, fetchVisitsInProgress]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      date: formData.date ? `${formData.date}T08:00:00` : "",
    };

    try {
      if (editId) {
        await api.put(`consultations/${editId}/`, payload);
      } else {
        await api.post("consultations/", payload);
      }

      setFormData({
        patient: "",
        doctor: "",
        date: "",
        symptoms: "",
        diagnosis: "",
        treatment: "",
        notes: "",
      });

      setEditId(null);
      setShowForm(false);
      fetchConsultations();
  } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.patient || "Erreur lors de la sauvegarde";
      alert(errorMsg);
      console.error("Erreur sauvegarde :", err.response?.data || err.message);
    }
  };

  const handleEdit = (c) => {
    setFormData({
      patient: c.patient,
      doctor: c.doctor,
      date: c.date?.slice(0, 10),
      symptoms: c.symptoms || "",
      diagnosis: c.diagnosis || "",
      treatment: c.treatment || "",
      notes: c.notes || "",
    });

    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await api.delete(`consultations/${id}/`);
      fetchConsultations();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle "Consulter" button click from visits list
  const handleConsultFromVisit = (visit) => {
    setFormData({
      patient: visit.patient,
      doctor: "",
      date: new Date().toISOString().slice(0, 10),
      symptoms: "",
      diagnosis: "",
      treatment: "",
      notes: "",
    });
    setEditId(null);
    setShowForm(true);
    setShowVisits(false);
    setSelectedVisit(null);
  };

  // Format patient ID (P001, P002, etc.)
  const formatPatientId = (id) => {
    return `P${String(id).padStart(3, '0')}`;
  };

  return (
    <>
      <Sidebar />
      <Navbar />

      <div className="consultations-container">
        <h1>Gestion des consultations</h1>

        {["admin", "doctor", "nurse"].includes(user?.role) && (
          <div className="button-container">
            <button 
              className={`visit-toggle-btn ${showVisits ? 'active' : ''}`}
              onClick={() => {
                setShowVisits(!showVisits);
                setShowForm(false);
                setSelectedVisit(null);
              }}
            >
              {showVisits ? "× Visites" : "Visites"}
            </button>
            <button className="fab" onClick={() => {
              setShowForm(!showForm);
              setShowVisits(false);
              setSelectedVisit(null);
              if (!showForm) {
                setFormData({
                  patient: "",
                  doctor: "",
                  date: "",
                  symptoms: "",
                  diagnosis: "",
                  treatment: "",
                  notes: "",
                });
                setEditId(null);
              }
            }}>
              {showForm ? "×" : "+"}
            </button>
          </div>
        )}

        {showVisits && (
          <div className="visits-panel">
            <h2>Patients en visite</h2>
            {!selectedVisit ? (
              <div className="visits-list">
                {visits.length === 0 ? (
                  <p className="no-visits">Aucun patient en visite</p>
                ) : (
                  visits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="visit-card"
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <div className="visit-number">{formatPatientId(visit.patient)}</div>
                      <div className="visit-info">
                        <span className="visit-name">
                          {visit.patient_first_name} {visit.patient_last_name}
                        </span>
                        <span className="visit-date">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="visit-details">
                <button 
                  className="back-btn"
                  onClick={() => setSelectedVisit(null)}
                >
                  ← Retour
                </button>
                
                <div className="patient-info-card">
                  <h3>Informations du patient</h3>
                  <div className="info-row">
                    <span className="info-label">ID:</span>
                    <span className="info-value">{formatPatientId(selectedVisit.patient)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nom:</span>
                    <span className="info-value">{selectedVisit.patient_first_name} {selectedVisit.patient_last_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date de naissance:</span>
                    <span className="info-value">{new Date(selectedVisit.patient_date_of_birth).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Genre:</span>
                    <span className="info-value">{selectedVisit.patient_gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Téléphone:</span>
                    <span className="info-value">{selectedVisit.patient_phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedVisit.patient_email || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Adresse:</span>
                    <span className="info-value">{selectedVisit.patient_address || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{selectedVisit.patient_type === 'ambulant' ? 'Ambulant' : 'Interne'}</span>
                  </div>
                </div>

                <button 
                  className="consult-btn"
                  onClick={() => handleConsultFromVisit(selectedVisit)}
                >
                  Consulter
                </button>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="consultation-form-container">
            <h2>{editId ? "Modifier la consultation" : "Nouvelle consultation"}</h2>

            <form className="consultation-form" onSubmit={handleSubmit}>
              {formData.patient && !editId ? (
                <div className="patient-selected-display">
                  <label>Patient:</label>
                  <span className="patient-badge">
                    {formatPatientId(formData.patient)} - {patients.find(p => p.id === parseInt(formData.patient))?.first_name} {patients.find(p => p.id === parseInt(formData.patient))?.last_name}
                  </span>
                </div>
              ) : (
                <select required value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })}>
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              )}

              <select required value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value })}>
                <option value="">Sélectionner un médecin</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.username}</option>
                ))}
              </select>

              <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />

              <textarea required placeholder="Symptômes" value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} />

              <textarea placeholder="Traitement" value={formData.treatment} onChange={e => setFormData({ ...formData, treatment: e.target.value })} />

              <textarea required placeholder="Diagnostic" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />

              <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />

              <button type="submit" className="edit-btn">
                {editId ? "Modifier" : "Ajouter"}
              </button>
            </form>
          </div>
        )}

        <table className="consultations-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Médecin</th>
              <th>Date</th>
              <th>Diagnostic</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map(c => {
              const p = patients.find(x => x.id === c.patient);
              const d = doctors.find(x => x.id === c.doctor);

              return (
                <tr key={c.id}>
                  <td>{p ? `${p.first_name} ${p.last_name}` : "-"}</td>
                  <td>{d ? d.username : "-"}</td>
                  <td>{c.date?.slice(0,10)}</td>
                  <td>{c.diagnosis}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(c)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Consultations;
