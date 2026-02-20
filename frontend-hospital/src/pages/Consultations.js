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

  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => {
    if (token) {
      fetchConsultations();
      fetchPatients();
      fetchDoctors();
    }
  }, [token, fetchConsultations, fetchPatients, fetchDoctors]);

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

  return (
    <>
      <Sidebar />
      <Navbar />

      <div className="consultations-container">
        <h1>Gestion des consultations</h1>

        {["admin", "doctor", "nurse"].includes(user?.role) && (
          <div className="fab-container">
            <button className="fab" onClick={() => setShowForm(!showForm)}>
              {showForm ? "×" : "+"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="consultation-form-container">
            <h2>{editId ? "Modifier la consultation" : "Nouvelle consultation"}</h2>

            <form className="consultation-form" onSubmit={handleSubmit}>
              <select required value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })}>
                <option value="">Sélectionner un patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>

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
