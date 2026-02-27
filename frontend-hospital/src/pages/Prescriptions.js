import React, { useState, useEffect, useContext, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./Prescriptions.css";

const Prescriptions = () => {
  const { user, token } = useContext(AuthContext);

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);

  const [formData, setFormData] = useState({
    consultation: "",
    lab_test: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [availableLabTests, setAvailableLabTests] = useState([]);

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

  const fetchLabTests = useCallback(async () => {
    try {
      const res = await api.get("laboratory/");
      setLabTests(res.data);
    } catch (err) {
      console.error("Erreur récupération tests laboratoire :", err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchPrescriptions();
      fetchConsultations();
      fetchPatients();
      fetchLabTests();
    }
  }, [token, fetchPrescriptions, fetchConsultations, fetchPatients, fetchLabTests]);

  // Mettre à jour les tests de laboratoire disponibles quand une consultation est sélectionnée
  useEffect(() => {
    if (formData.consultation) {
      const consultation = consultations.find(c => c.id === parseInt(formData.consultation));
      if (consultation) {
        const patientId = consultation.patient;
        const patientLabTests = labTests.filter(lab => lab.patient === patientId);
        setAvailableLabTests(patientLabTests);
        
        if (patientLabTests.length === 1) {
          setFormData(prev => ({ ...prev, lab_test: patientLabTests[0].id.toString() }));
        } else if (patientLabTests.length === 0) {
          setFormData(prev => ({ ...prev, lab_test: "" }));
        }
      }
    } else {
      setAvailableLabTests([]);
    }
  }, [formData.consultation, consultations, labTests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.lab_test) {
        delete dataToSend.lab_test;
      }
      
      if (editId) {
        await api.put(`prescriptions/${editId}/`, dataToSend);
      } else {
        await api.post("prescriptions/", dataToSend);
      }

      setFormData({
        consultation: "",
        lab_test: "",
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });

      setEditId(null);
      setShowForm(false);
      setAvailableLabTests([]);
      fetchPrescriptions();
    } catch (err) {
      console.error("Erreur sauvegarde prescription :", err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      }
    }
  };

  const handleEdit = (p) => {
    const consultation = consultations.find(c => c.id === p.consultation);
    if (consultation) {
      const patientId = consultation.patient;
      const patientLabTests = labTests.filter(lab => lab.patient === patientId);
      setAvailableLabTests(patientLabTests);
    }
    
    setFormData({
      consultation: p.consultation?.toString() || "",
      lab_test: p.lab_test?.toString() || "",
      medication: p.medication,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions || "",
    });
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleConsultationChange = (e) => {
    const consultationId = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      consultation: consultationId,
      lab_test: ""
    }));
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

  const getLabTestInfo = (labTestId) => {
    if (!labTestId) return null;
    const lab = labTests.find(l => l.id === labTestId);
    if (lab) {
      const patient = patients.find(p => p.id === lab.patient);
      return patient ? `${patient.first_name} ${patient.last_name} - ${lab.test_name}` : lab.test_name;
    }
    return null;
  };

  const getSelectedPatientInfo = () => {
    if (!formData.consultation) return null;
    const consultation = consultations.find(c => c.id === parseInt(formData.consultation));
    if (consultation) {
      return patients.find(p => p.id === consultation.patient);
    }
    return null;
  };

  const selectedPatient = getSelectedPatientInfo();

  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="prescriptions-container">
        <h1>Gestion des Prescriptions</h1>

        {isAdmin && (
          <div className="read-only-notice">
            <span>🔒 Mode lecture seule - Vous pouvez uniquement consulter les prescriptions</span>
          </div>
        )}

        {isDoctor && (
          <div className="fab-container">
            <button className="fab" onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setFormData({
                  consultation: "",
                  lab_test: "",
                  medication: "",
                  dosage: "",
                  frequency: "",
                  duration: "",
                  instructions: "",
                });
                setAvailableLabTests([]);
              }
            }}>
              {showForm ? "×" : "+"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="form-container">
            <div className="form-header">
              <div className="form-header-icon">📋</div>
              <h2>{editId ? "Modifier la prescription" : "Nouvelle prescription"}</h2>
            </div>

            <div className="form-content">
              <form className="prescription-form" onSubmit={handleSubmit}>

                {/* Consultation */}
                <div className="form-section">
                  <label>Consultation</label>
                  <select
                    required
                    value={formData.consultation}
                    onChange={handleConsultationChange}
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

                {/* Patient Info Card */}
                {selectedPatient && (
                  <div className="patient-info-card">
                    <div className="patient-info-header">
                      <span className="patient-info-icon">👤</span>
                      <span className="patient-info-title">Patient sélectionné</span>
                    </div>
                    <div className="patient-info-details">
                      <span><strong>Nom:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</span>
                      <span><strong>Téléphone:</strong> {selectedPatient.phone}</span>
                    </div>
                    
                    {availableLabTests.length > 0 && (
                      <div className="lab-test-available">
                        <span>✅ {availableLabTests.length} test(s) de laboratoire disponible(s) pour ce patient</span>
                      </div>
                    )}
                    
                    {selectedPatient && availableLabTests.length === 0 && formData.consultation && (
                      <div className="no-lab-test">
                        <span>⚠️ Aucun test de laboratoire trouvé pour ce patient</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lab Test */}
                <div className="form-section">
                  <label>Résultat de Laboratoire {availableLabTests.length > 0 && "(automatique)"}</label>
                  <select
                    value={formData.lab_test}
                    onChange={(e) =>
                      setFormData({ ...formData, lab_test: e.target.value })
                    }
                    disabled={!formData.consultation}
                  >
                    <option value="">
                      {availableLabTests.length > 0 
                        ? `${availableLabTests.length} test(s) disponible(s) - Sélection auto`
                        : formData.consultation ? "Aucun test disponible" : "Sélectionnez d'abord une consultation"
                      }
                    </option>
                    {availableLabTests.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.test_name} ({lab.performed_at?.slice(0, 10)})
                        {lab.result ? ` - Résultat: ${lab.result.substring(0, 50)}...` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Groupe Médicament */}
                <div className="medication-group">
                  {/* Médicament */}
                  <div className="form-section">
                    <label>Médicament</label>
                    <input
                      type="text"
                      placeholder="Nom du médicament"
                      value={formData.medication}
                      onChange={(e) =>
                        setFormData({ ...formData, medication: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Dosage */}
                  <div className="form-section">
                    <label>Dosage</label>
                    <input
                      type="text"
                      placeholder="Ex: 500mg"
                      value={formData.dosage}
                      onChange={(e) =>
                        setFormData({ ...formData, dosage: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Fréquence */}
                  <div className="form-section">
                    <label>Fréquence</label>
                    <input
                      type="text"
                      placeholder="Ex: 3 fois/jour"
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Durée */}
                  <div className="form-section">
                    <label>Durée</label>
                    <input
                      type="text"
                      placeholder="Ex: 7 jours"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="form-section">
                  <label>Instructions complémentaires</label>
                  <textarea
                    placeholder="Instructions complémentaires pour le patient..."
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                  />
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowForm(false);
                      setEditId(null);
                      setFormData({
                        consultation: "",
                        lab_test: "",
                        medication: "",
                        dosage: "",
                        frequency: "",
                        duration: "",
                        instructions: "",
                      });
                      setAvailableLabTests([]);
                    }}
                  >
                    Annuler
                  </button>
                  <button className="edit-btn" type="submit">
                    {editId ? "Modifier" : "Ajouter"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* CARTES DE PRESCRIPTIONS */}
        <div className="prescriptions-grid">
          {prescriptions.map((p) => {
            const labTestInfo = getLabTestInfo(p.lab_test);
            return (
              <div key={p.id} className="prescription-card">
                <div className="prescription-card-header">
                  <div className="patient-info">
                    <span className="patient-name">{getPatientName(p.consultation)}</span>
                    <span className="consultation-date">{getConsultationDate(p.consultation)}</span>
                  </div>
                </div>
                
                <div className="medication-info">
                  <span className="medication-name">{p.medication}</span>
                  
                  <div className="dosage-frequency">
                    <span className="dosage-badge">{p.dosage}</span>
                    <span className="frequency-badge">{p.frequency}</span>
                    <span className="duration-badge">{p.duration}</span>
                  </div>
                  
                  {labTestInfo && (
                    <div className="lab-test-info">
                      🔬 {labTestInfo}
                    </div>
                  )}
                  
                  {p.instructions && (
                    <div className="instructions">
                      {p.instructions}
                    </div>
                  )}
                </div>

                {isDoctor && (
                  <div className="prescription-card-actions">
                    <button className="edit-btn" onClick={() => handleEdit(p)}>
                      ✏️ Modifier
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {prescriptions.length === 0 && (
          <div className="empty-state">
            <span>Aucune prescription trouvée</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
