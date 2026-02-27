import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./Laboratory.css";

/**
 * ==========================
 * PAGE LABORATORY
 * CRUD complet avec API Django
 * Sécurisé par JWT
 * ==========================
 */

const Laboratory = () => {
  // 🔐 Récupération du user + token depuis le contexte global
  const { user, token } = useContext(AuthContext);

  // 📋 Liste des tests laboratoire
  const [labTests, setLabTests] = useState([]);

  // 📋 Liste des patients pour le dropdown
  const [patients, setPatients] = useState([]);

  // 📋 Liste des patients consultés
  const [consultedPatients, setConsultedPatients] = useState([]);
  const [selectedConsultedPatient, setSelectedConsultedPatient] = useState(null);

  // 📋 Détails du patient sélectionné avec ses consultations
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // 📝 Formulaire test laboratoire
  const [formData, setFormData] = useState({
    patient: "",
    test_name: "",
    result: "",
  });

  // ✏️ ID du test en cours d'édition
  const [editId, setEditId] = useState(null);

  // 🔄 Affichage du formulaire
  const [showForm, setShowForm] = useState(false);

  // 🔄 Affichage des patients consultés
  const [showConsulted, setShowConsulted] = useState(false);

  // 📥 Chargement de tous les patients pour le dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const response = await api.get("patients/");
      setPatients(response.data);
    } catch (error) {
      console.error("Erreur récupération patients :", error);
    }
  }, []);

  /**
   * 📥 Chargement de tous les tests laboratoire
   */
  const fetchLabTests = useCallback(async () => {
    try {
      const response = await api.get("laboratory/");
      setLabTests(response.data);
    } catch (error) {
      console.error("Erreur récupération tests laboratoire :", error);
    }
  }, []);

  /**
   * 📥 Chargement des patients consultés
   */
  const fetchConsultedPatients = useCallback(async () => {
    try {
      const response = await api.get("patients/consulted/");
      setConsultedPatients(response.data);
    } catch (error) {
      console.error("Erreur récupération patients consultés :", error);
    }
  }, []);

  /**
   * 🔄 Chargement automatique dès que le token existe
   */
  useEffect(() => {
    if (token) {
      fetchLabTests();
      fetchPatients();
      fetchConsultedPatients();
    }
  }, [token, fetchLabTests, fetchPatients, fetchConsultedPatients]);

  /**
   * ➕ / ✏️ Ajouter ou modifier un test laboratoire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient || !formData.test_name) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const patientId = parseInt(formData.patient);
    if (isNaN(patientId)) {
      alert("Veuillez sélectionner un patient valide");
      return;
    }

    if (!user?.id) {
      alert("Erreur: Utilisateur non connecté");
      return;
    }

    try {
      const dataToSend = {
        patient: patientId,
        test_name: formData.test_name,
        result: formData.result || "",
      };


      if (editId) {
        await api.put(`laboratory/${editId}/`, dataToSend);
      } else {
        await api.post("laboratory/", dataToSend);
      }

      setFormData({
        patient: "",
        test_name: "",
        result: "",
      });

      setEditId(null);
      setShowForm(false);
      fetchLabTests();
    } catch (error) {
      console.error("Erreur sauvegarde test laboratoire :", error);
      if (error.response?.status === 400) {
        alert(error.response?.data?.error || "Erreur de validation. Veuillez vérifier les champs.");
      } else {
        alert("Erreur lors de la sauvegarde du test.");
      }
    }
  };

  /**
   * ✏️ Préparer le formulaire pour l'édition
   */
  const handleEdit = (labTest) => {
    setFormData({
      patient: labTest.patient,
      test_name: labTest.test_name,
      result: labTest.result || "",
    });

    setEditId(labTest.id);
    setShowForm(true);
  };

  /**
   * 🗑️ Suppression d'un test laboratoire
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await api.delete(`laboratory/${id}/`);
      fetchLabTests();
    } catch (error) {
      console.error("Erreur suppression test laboratoire :", error);
    }
  };

  // Fetch patient details with consultations
  const fetchPatientDetails = useCallback(async (patientId) => {
    setLoadingPatientDetails(true);
    try {
      const response = await api.get(`patients/${patientId}/with-consultations/`);
      setPatientDetails(response.data);
    } catch (error) {
      console.error("Erreur récupération détails patient :", error);
      setPatientDetails(null);
    } finally {
      setLoadingPatientDetails(false);
    }
  }, []);

  // Handle patient consulted click - show patient details
  const handleConsultedPatientClick = (patient) => {
    setSelectedConsultedPatient(patient);
    fetchPatientDetails(patient.id);
  };

  // Handle "Test" button click - open form with patient pre-filled
  const handleTestButtonClick = () => {
    setFormData({
      patient: selectedConsultedPatient.id.toString(),
      test_name: "",
      result: "",
    });
    setEditId(null);
    setShowForm(true);
    setShowConsulted(false);
    setPatientDetails(null);
    setSelectedConsultedPatient(null);
  };

  // Handle back button from patient details
  const handleBackToList = () => {
    setSelectedConsultedPatient(null);
    setPatientDetails(null);
  };

  // Fonction pour obtenir le nom du patient
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${patientId}`;
  };

  // Format patient ID (P001, P002, etc.)
  const formatPatientId = (id) => {
    return `P${String(id).padStart(3, '0')}`;
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
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

      <div className="laboratory-container">
        <div className="laboratory-header">
          <h1>Gestion des Tests Laboratoire</h1>
          
          {/* Boutons */}
          <div className="header-buttons">
            {/* Bouton Patients Consultés */}
            {["admin", "lab", "doctor", "nurse"].includes(user?.role) && (
              <button
                className={`consulted-btn ${showConsulted ? 'active' : ''}`}
                onClick={() => {
                  setShowConsulted(!showConsulted);
                  setShowForm(false);
                  setSelectedConsultedPatient(null);
                }}
              >
                {showConsulted ? "× Consultés" : "Consultés"}
              </button>
            )}
            
            {/* Bouton Ajouter test */}
            {["admin", "lab"].includes(user?.role) && (
              <button
                className="add-btn"
                onClick={() => {
                  setShowForm(!showForm);
                  setShowConsulted(false);
                  setSelectedConsultedPatient(null);
                  if (!showForm) {
                    setFormData({
                      patient: "",
                      test_name: "",
                      result: "",
                    });
                    setEditId(null);
                  }
                }}
              >
                {showForm ? "Fermer" : "+ Nouveau Test"}
              </button>
            )}
          </div>
        </div>

        {/* Panneau Patients Consultés */}
        {showConsulted && (
          <div className="consulted-panel">
            <h2>Patients Consultés</h2>
            {!selectedConsultedPatient ? (
              <div className="consulted-list">
                {consultedPatients.length === 0 ? (
                  <p className="no-data-text">Aucun patient consulté</p>
                ) : (
                  consultedPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="consulted-card"
                      onClick={() => handleConsultedPatientClick(patient)}
                    >
                      <div className="consulted-card-info">
                        <span className="patient-id">{formatPatientId(patient.id)}</span>
                        <span className="patient-name">{patient.first_name} {patient.last_name}</span>
                      </div>
                      <span className="select-hint">Cliquer pour voir les détails</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="patient-details-panel">
                <button className="back-btn" onClick={handleBackToList}>
                  ← Retour
                </button>
                
                {loadingPatientDetails ? (
                  <p className="loading-text">Chargement...</p>
                ) : patientDetails ? (
                  <>
                    <div className="patient-info-card">
                      <h3>Informations du patient</h3>
                      <div className="info-row">
                        <span className="info-label">ID:</span>
                        <span className="info-value">{formatPatientId(patientDetails.id)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Nom:</span>
                        <span className="info-value">{patientDetails.first_name} {patientDetails.last_name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Date de naissance:</span>
                        <span className="info-value">{new Date(patientDetails.date_of_birth).toLocaleDateString()}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Genre:</span>
                        <span className="info-value">{patientDetails.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Téléphone:</span>
                        <span className="info-value">{patientDetails.phone}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{patientDetails.email || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Adresse:</span>
                        <span className="info-value">{patientDetails.address || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Type:</span>
                        <span className="info-value">{patientDetails.patient_type === 'ambulant' ? 'Ambulant' : 'Interne'}</span>
                      </div>
                    </div>

                    {/* Consultations */}
                    <div className="consultations-section">
                      <h3>Consultations</h3>
                      {patientDetails.consultations && patientDetails.consultations.length > 0 ? (
                        <div className="consultations-list">
                          {patientDetails.consultations.map((consultation) => (
                            <div key={consultation.id} className="consultation-item">
                              <div className="consultation-header">
                                <span className="consultation-date">
                                  {new Date(consultation.date).toLocaleDateString()}
                                </span>
                                <span className="consultation-doctor">
                                  Dr. {consultation.doctor_name}
                                </span>
                              </div>
                              <div className="consultation-details">
                                <div className="consultation-field">
                                  <span className="field-label">Symptômes:</span>
                                  <span className="field-value">{consultation.symptoms || '-'}</span>
                                </div>
                                <div className="consultation-field">
                                  <span className="field-label">Diagnostic:</span>
                                  <span className="field-value">{consultation.diagnosis || '-'}</span>
                                </div>
                                <div className="consultation-field">
                                  <span className="field-label">Traitement:</span>
                                  <span className="field-value">{consultation.treatment || '-'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-consultations">Aucune consultation</p>
                      )}
                    </div>

                    {/* Bouton Test */}
                    {["admin", "lab"].includes(user?.role) && (
                      <button className="test-btn" onClick={handleTestButtonClick}>
                        🧪 Nouveau Test
                      </button>
                    )}
                  </>
                ) : (
                  <p className="error-text">Erreur lors du chargement des détails</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 📝 Formulaire */}
        {showForm && (
          <div className="form-container">
            <h2>{editId ? "Modifier le test" : "Nouveau Test"}</h2>
            <form className="laboratory-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Patient</label>
                <select
                  value={formData.patient}
                  onChange={(e) =>
                    setFormData({ ...formData, patient: e.target.value })
                  }
                  required
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nom du Test</label>
                <input
                  type="text"
                  placeholder="Ex: Analyse de sang, Urée, etc."
                  value={formData.test_name}
                  onChange={(e) =>
                    setFormData({ ...formData, test_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Résultat</label>
                <textarea
                  placeholder="Résultat du test..."
                  value={formData.result}
                  onChange={(e) =>
                    setFormData({ ...formData, result: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button className="cancel-btn" type="button" onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setFormData({ patient: "", test_name: "", result: "" });
                }}>
                  Annuler
                </button>
                <button className="submit-btn" type="submit">
                  {editId ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 📊 Cartes des tests laboratoire */}
        <div className="lab-cards-container">
          {labTests.length > 0 ? (
            labTests.map((test) => (
              <div key={test.id} className="lab-card">
                <div className="lab-card-header">
                  <span className="lab-card-icon">🧪</span>
                  <h3>{test.test_name}</h3>
                </div>
                
                <div className="lab-card-body">
                  <div className="lab-card-info">
                    <span className="lab-card-label">Patient:</span>
                    <span className="lab-card-value">{getPatientName(test.patient)}</span>
                  </div>
                  
                  <div className="lab-card-info">
                    <span className="lab-card-label">Résultat:</span>
                    <span className="lab-card-result">
                      {test.result || <span className="no-result">En attente...</span>}
                    </span>
                  </div>
                  
                  <div className="lab-card-info">
                    <span className="lab-card-label">Effectué par:</span>
                    <span className="lab-card-value">#{test.performed_by}</span>
                  </div>
                  
                  <div className="lab-card-info">
                    <span className="lab-card-label">Date:</span>
                    <span className="lab-card-value">{formatDate(test.performed_at)}</span>
                  </div>
                </div>

                {["admin", "lab"].includes(user?.role) && (
                  <div className="lab-card-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(test)}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(test.id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-data">
              <span className="no-data-icon">🔬</span>
              <p>Aucun test laboratoire trouvé.</p>
              <p className="no-data-subtitle">Cliquez sur "Nouveau Test" pour commencer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Laboratory;
