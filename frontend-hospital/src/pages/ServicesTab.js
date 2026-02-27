import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./ServicesTab.css";

const ServicesTab = () => {
  const { user, token } = useContext(AuthContext);

  const [medicalActs, setMedicalActs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    date: "",
    type: "",
    description: "",
    notes: "",
    service: "",
  });

  const fetchMedicalActs = async () => {
    try {
      const [consultations, labs, prescriptions] = await Promise.all([
        api.get("consultations/"),
        api.get("laboratory/"),
        api.get("prescriptions/"),
      ]);
      const acts = [
        ...consultations.data.map(c => ({ ...c, type: 'Consultation', date: c.date, description: c.diagnosis + ' ' + c.treatment, notes: c.notes })),
        ...labs.data.map(l => ({ ...l, type: 'Lab Test', date: l.date, description: l.test_name, notes: l.result })),
        ...prescriptions.data.map(p => ({ ...p, type: 'Prescription', date: p.date, description: p.medication, notes: p.dosage })),
      ];
      setMedicalActs(acts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("accounts/");
      setDoctors(res.data.filter(u => u.role === "doctor"));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get("services/");
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMedicalActs();
      fetchPatients();
      fetchDoctors();
      fetchServices();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let data = {};
      if (formType === 'consultation') {
        endpoint = 'consultations/';
        data = {
          patient: formData.patient,
          doctor: formData.doctor,
          date: formData.date,
          service: formData.service,
          symptoms: formData.description,
          diagnosis: formData.description,
          treatment: '',
          notes: formData.notes,
        };
      } else if (formType === 'lab') {
        endpoint = 'laboratory/';
        data = {
          patient: formData.patient,
          service: formData.service,
          test_name: formData.description,
          date: formData.date,
          result: formData.notes,
        };
      } else if (formType === 'imaging') {
        // Assume imaging is part of lab or separate, for now use lab
        endpoint = 'laboratory/';
        data = {
          patient: formData.patient,
          service: formData.service,
          test_name: 'Imaging: ' + formData.description,
          date: formData.date,
          result: formData.notes,
        };
      } else if (formType === 'note') {
        // Assume note is added to consultations
        endpoint = 'consultations/';
        data = {
          patient: formData.patient,
          doctor: formData.doctor,
          service: formData.service,
          date: formData.date,
          symptoms: '',
          diagnosis: 'Note: ' + formData.description,
          treatment: '',
          notes: formData.notes,
        };
      } else if (formType === 'observation' || formType === 'vital' || formType === 'nursing_note') {
        // For nurses, add to consultations with type
        endpoint = 'consultations/';
        data = {
          patient: formData.patient,
          doctor: '', // No doctor for nurses
          service: formData.service,
          date: formData.date,
          symptoms: '',
          diagnosis: formType + ': ' + formData.description,
          treatment: '',
          notes: formData.notes,
        };
      }
      if (editId) {
        await api.put(`${endpoint}${editId}/`, data);
      } else {
        await api.post(endpoint, data);
      }
      setFormData({
        patient: "",
        doctor: "",
        date: "",
        type: "",
        description: "",
        notes: "",
        service: "",
      });
      setEditId(null);
      setShowForm(false);
      fetchMedicalActs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (act) => {
    // For simplicity, not implementing edit for all types
    // Assume edit is for consultations
    if (act.type === 'Consultation') {
      setFormData({
        patient: act.patient,
        doctor: act.doctor,
        date: act.date?.slice(0,10),
        type: 'consultation',
        description: act.diagnosis,
        notes: act.notes,
      });
      setFormType('consultation');
      setEditId(act.id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      let endpoint = '';
      if (type === 'Consultation') {
        endpoint = 'consultations/';
      } else if (type === 'Lab Test') {
        endpoint = 'laboratory/';
      } else if (type === 'Prescription') {
        endpoint = 'prescriptions/';
      }
      await api.delete(`${endpoint}${id}/`);
      fetchMedicalActs();
    } catch (err) {
      console.error(err);
    }
  };

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
    setFormData({
      patient: "",
      doctor: "",
      date: new Date().toISOString().slice(0,10),
      type: type,
      description: "",
      notes: "",
      service: "",
    });
    setEditId(null);
  };

  return (
    <>
      <Sidebar />
      <Navbar />
      <div className="services-container">
        <h1>Services Médicaux</h1>
        
        {/* Services Section */}
        {services.length > 0 && (
          <div className="services-list">
            <h2>Départements</h2>
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="service-card">
                  <h3>{service.name}</h3>
                  <span className={`service-type ${service.service_type}`}>
                    {service.service_type === 'ambulant' ? '🟢 Ambulatoire' : '🔴 Hospitalisation'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="button-container">
          {["admin", "doctor"].includes(user?.role) && (
            <>
              <button onClick={() => openForm('consultation')}>➕ Nouvelle consultation</button>
              <button onClick={() => openForm('lab')}>➕ Demande test laboratoire</button>
              <button onClick={() => openForm('imaging')}>➕ Demande imagerie</button>
              <button onClick={() => openForm('note')}>➕ Note médicale</button>
            </>
          )}
          {user?.role === 'nurse' && (
            <>
              <button onClick={() => openForm('observation')}>➕ Observation infirmière</button>
              <button onClick={() => openForm('vital')}>➕ Constantes vitales</button>
              <button onClick={() => openForm('nursing_note')}>➕ Note de suivi infirmier</button>
            </>
          )}
        </div>
        {showForm && (
          <div className="form-container">
            <h2>{formType === 'consultation' ? 'Nouvelle consultation' : formType === 'lab' ? 'Demande test laboratoire' : formType === 'imaging' ? 'Demande imagerie' : formType === 'note' ? 'Note médicale' : formType === 'observation' ? 'Observation infirmière' : formType === 'vital' ? 'Constantes vitales' : 'Note de suivi infirmier'}</h2>
            <form onSubmit={handleSubmit}>
              <select value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })} required>
                <option value="">Sélectionner un patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              {["admin", "doctor"].includes(user?.role) && (
                <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value })} required>
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                </select>
              )}
              <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} required>
                <option value="">Sélectionner un service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.service_type})</option>)}
              </select>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
              <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              <button type="submit">{editId ? 'Modifier' : 'Ajouter'}</button>
            </form>
          </div>
        )}
        <div className="timeline">
          {medicalActs.sort((a,b) => new Date(b.date) - new Date(a.date)).map(act => (
            <div key={act.id} className="timeline-item">
              <div className="timeline-date">{new Date(act.date).toLocaleDateString()}</div>
              <div className="timeline-content">
                <h3>{act.type}</h3>
                <p>{act.description}</p>
                <p>{act.notes}</p>
                {["admin", "doctor"].includes(user?.role) && (
                  <>
                    <button onClick={() => handleEdit(act)}>Edit</button>
                    <button onClick={() => handleDelete(act.id, act.type)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ServicesTab;
