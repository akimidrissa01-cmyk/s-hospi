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
import "./Patients.css";

const Patients = () => {

  const { user, token } = useContext(AuthContext);

  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "M",
    phone: "",
    email: "",
    address: "",
    patient_type: "ambulant",
  });

  const [visitFormData, setVisitFormData] = useState({
    patient: "",
    doctor: "",
    service: "",
    visit_type: "ambulant",
    notes: "",
  });

  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");

  // Modal pour les services du patient
  const [showPatientVisitsModal, setShowPatientVisitsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [isInterne, setIsInterne] = useState(false);

  /* ================= FETCH ================= */

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data);
    } catch (err) {
      console.error("Erreur patients :", err);
    }
  }, []);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await api.get("patients/visits/");
      setVisits(res.data);
    } catch (err) {
      console.error("Erreur visites :", err);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get("accounts/doctors/");
      setDoctors(res.data);
    } catch (err) {
      console.error("Erreur médecins :", err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get("services/");
      setServices(res.data);
    } catch (err) {
      console.error("Erreur services :", err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchPatients();
      fetchVisits();
      fetchDoctors();
      fetchServices();
    }
  }, [token, fetchPatients, fetchVisits, fetchDoctors, fetchServices]);

  /* ================= PATIENT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await api.put(`patients/${editId}/`, formData);
      } else {
        await api.post("patients/", formData);
      }

      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "M",
        phone: "",
        email: "",
        address: "",
        patient_type: "ambulant",
      });

      setEditId(null);
      setShowForm(false);
      fetchPatients();
    } catch (err) {
      console.error("Erreur patient :", err);
    }
  };

  const handleEdit = (patient) => {
    setFormData(patient);
    setEditId(patient.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await api.delete(`patients/${id}/`);
      fetchPatients();
    } catch (err) {
      console.error("Erreur suppression patient :", err);
    }
  };

  /* ================= VISITS ================= */

  const handleVisitSubmit = async (e) => {
    e.preventDefault();

    try {
      const visitData = {
        patient: parseInt(visitFormData.patient),
        doctor: parseInt(visitFormData.doctor),
        service: visitFormData.service,
        visit_type: visitFormData.visit_type,
        notes: visitFormData.notes,
      };
      
      await api.post("patients/visits/", visitData);

      setVisitFormData({
        patient: "",
        doctor: "",
        service: "",
        visit_type: "ambulant",
        notes: "",
      });

      setShowVisitForm(false);
      fetchVisits();
    } catch (err) {
      console.error("Erreur visite :", err.response?.data || err);
    }
  };

  const handleVisitDelete = async (id) => {
    if (!window.confirm("Supprimer cette visite ?")) return;
    try {
      await api.delete(`patients/visits/${id}/`);
      fetchVisits();
    } catch (err) {
      console.error("Erreur suppression visite :", err);
    }
  };

  const handleVisitStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`patients/visits/${id}/`, { status: newStatus });
      fetchVisits();
    } catch (err) {
      console.error("Erreur mise à jour statut :", err);
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;

    if (patientId) {
      const patient = patients.find(
        (p) => p.id === parseInt(patientId)
      );

      if (patient) {
        setVisitFormData({
          ...visitFormData,
          patient: patientId,
          visit_type: patient.patient_type,
          service: "",
        });
        return;
      }
    }

    setVisitFormData({ ...visitFormData, patient: patientId });
  };

  const filteredServices = services.filter(
    (s) => s.service_type === visitFormData.visit_type
  );

  const getPatientName = (id) => {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "—";
  };

  const getDoctorName = (id) => {
    const d = doctors.find((x) => x.id === id);
    return d ? `Dr ${d.first_name} ${d.last_name}` : "—";
  };

  // Fonction pour ouvrir la modal des services du patient
  const openPatientVisitsModal = (visit) => {
    setSelectedPatient(visit);
    
    // Check if patient is interne (hospitalized)
    const isInternePatient = visit.visit_type === 'interne';
    setIsInterne(isInternePatient);
    
    // For interne patients, all services are checked by default and cannot be unchecked
    // For ambulant patients, only consultation is checked by default
    setPatientVisits({
      consultation_done: visit.consultation_done !== undefined ? visit.consultation_done : true,
      laboratory_done: isInternePatient ? true : (visit.laboratory_done || false),
      prescription_done: isInternePatient ? true : (visit.prescription_done || false),
      pharmacy_done: isInternePatient ? true : (visit.pharmacy_done || false),
    });
    setShowPatientVisitsModal(true);
  };

  // Fonction pour mettre à jour le statut d'un service
  const handleServiceChange = async (serviceName, checked) => {
    if (!selectedPatient) return;
    
    const updateData = {};
    if (serviceName === "consultation") {
      updateData.consultation_done = checked;
    } else if (serviceName === "laboratory") {
      updateData.laboratory_done = checked;
    } else if (serviceName === "prescription") {
      updateData.prescription_done = checked;
    } else if (serviceName === "pharmacy") {
      updateData.pharmacy_done = checked;
    }

    try {
      await api.patch(`patients/visits/${selectedPatient.id}/`, updateData);
      setPatientVisits({ ...patientVisits, [serviceName + "_done"]: checked });
      fetchVisits();
    } catch (err) {
      console.error("Erreur mise à jour service :", err);
    }
  };

  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="patients-container">
        <h1>Gestion des Patients</h1>

        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            Patients
          </button>
          <button
            className={`tab ${activeTab === "visits" ? "active" : ""}`}
            onClick={() => setActiveTab("visits")}
          >
            Visites
          </button>
        </div>

        {/* ADD BUTTON - Only Admin and Nurse can add patients/visits */}
        {["admin", "nurse"].includes(user?.role) && (
          <div className="fab-container">
            <button
              className="fab"
              onClick={() =>
                activeTab === "patients"
                  ? setShowForm(!showForm)
                  : setShowVisitForm(!showVisitForm)
              }
            >
              +
            </button>
          </div>
        )}

        {/* FORM PATIENT */}
        {showForm && activeTab === "patients" && (
          <div className="form-container">
            <h2>{editId ? "Modifier le patient" : "Nouveau patient"}</h2>

            <form onSubmit={handleSubmit} className="patient-form">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  placeholder="Entrez le prénom"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Nom</label>
                <input
                  placeholder="Entrez le nom"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_of_birth: e.target.value,
                    })
                  }
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Genre</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type de patient</label>
                <select
                  value={formData.patient_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patient_type: e.target.value,
                    })
                  }
                >
                  <option value="ambulant">Ambulant</option>
                  <option value="interne">Interne</option>
                </select>
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>Adresse</label>
                <textarea
                  placeholder="Adresse complète"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
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

        {/* FORM VISIT */}
        {showVisitForm && activeTab === "visits" && (
          <div className="form-container">
            <h2>Nouvelle visite</h2>

            <form onSubmit={handleVisitSubmit} className="patient-form">
              <div className="form-group">
                <label>Patient</label>
                <select value={visitFormData.patient} onChange={handlePatientSelect} required>
                  <option value="">Sélectionner patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Médecin</label>
                <select
                  value={visitFormData.doctor}
                  onChange={(e) =>
                    setVisitFormData({
                      ...visitFormData,
                      doctor: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Sélectionner médecin</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr {d.first_name} {d.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type de visite</label>
                <select
                  value={visitFormData.visit_type}
                  onChange={(e) =>
                    setVisitFormData({
                      ...visitFormData,
                      visit_type: e.target.value,
                      service: "",
                    })
                  }
                >
                  <option value="ambulant">Patient Ambulant</option>
                  <option value="interne">Patient Interne</option>
                </select>
              </div>

              <div className="form-group">
                <label>Service</label>
                <div className="service-search-container">
                  <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={visitFormData.service || serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      setShowServiceDropdown(true);
                    }}
                    onFocus={() => setShowServiceDropdown(true)}
                    onBlur={() => setTimeout(() => setShowServiceDropdown(false), 200)}
                  />
                  {showServiceDropdown && (
                    <div className="service-dropdown">
                      {filteredServices
                        .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                        .map((s) => (
                          <div
                            key={s.id}
                            className="service-option"
                            onClick={() => {
                              setVisitFormData({ ...visitFormData, service: s.name });
                              setServiceSearch("");
                              setShowServiceDropdown(false);
                            }}
                          >
                            {s.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  placeholder="Notes supplémentaires..."
                  value={visitFormData.notes}
                  onChange={(e) =>
                    setVisitFormData({
                      ...visitFormData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowVisitForm(false);
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="edit-btn">
                  Créer la visite
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE PATIENTS */}
        {activeTab === "patients" && (
          <div className="table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Date de naissance</th>
                  <th>Genre</th>
                  <th>Type</th>
                  <th>Téléphone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.last_name}</td>
                    <td>{p.first_name}</td>
                    <td>{p.date_of_birth}</td>
                    <td>{p.gender === "M" ? "Homme" : "Femme"}</td>
                    <td>
                      <span className={`status ${p.patient_type === "ambulant" ? "status-pending" : "status-paid"}`}>
                        {p.patient_type === "ambulant" ? "Ambulant" : "Interne"}
                      </span>
                    </td>
                    <td>{p.phone}</td>
                    <td>
                      {["admin", "nurse"].includes(user?.role) && (
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(p)}
                            title="Modifier"
                          >
                            ✏️
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(p.id)}
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

        {/* TABLE VISITS */}
        {activeTab === "visits" && (
          <div className="table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span 
                        className="patient-link"
                        onClick={() => openPatientVisitsModal(v)}
                      >
                        {v.patient_name || getPatientName(v.patient)}
                      </span>
                    </td>
                    <td>{v.doctor_name || getDoctorName(v.doctor)}</td>
                    <td>{v.service}</td>
                    <td>
                      <span className={`status ${v.visit_type === "ambulant" ? "status-pending" : "status-paid"}`}>
                        {v.visit_type === "ambulant" ? "Ambulant" : "Interne"}
                      </span>
                    </td>
                    <td>
                      {["admin", "nurse"].includes(user?.role) ? (
                        <select
                          value={v.status}
                          onChange={(e) => handleVisitStatusChange(v.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="in_progress">En cours</option>
                          <option value="completed">Terminée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      ) : (
                        <span className={`status ${v.status === "completed" ? "status-paid" : v.status === "cancelled" ? "status-cancelled" : "status-pending"}`}>
                          {v.status === "in_progress" ? "En cours" : v.status === "completed" ? "Terminée" : "Annulée"}
                        </span>
                      )}
                    </td>
                    <td>{new Date(v.visit_date).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {["admin", "nurse"].includes(user?.role) && (
                        <button
                          className="delete-btn"
                          onClick={() => handleVisitDelete(v.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SERVICES PATIENT */}
      {showPatientVisitsModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              Services - {selectedPatient.patient_name || getPatientName(selectedPatient.patient)}
              {isInterne && <span className="patient-type-badge"> (Patient Interne)</span>}
            </h2>
            
            <div className="services-list">
              <label className="service-item">
                <input 
                  type="checkbox" 
                  checked={patientVisits.consultation_done} 
                  onChange={(e) => handleServiceChange("consultation", e.target.checked)}
                  disabled={isInterne}
                />
                <span className="service-name">Consultation</span>
                <span className="service-price">4$</span>
              </label>
              
              <label className="service-item">
                <input 
                  type="checkbox" 
                  checked={patientVisits.laboratory_done} 
                  onChange={(e) => handleServiceChange("laboratory", e.target.checked)}
                  disabled={isInterne}
                />
                <span className="service-name">Laboratoire</span>
                <span className="service-price">5$</span>
              </label>
              
              <label className="service-item">
                <input 
                  type="checkbox" 
                  checked={patientVisits.prescription_done} 
                  onChange={(e) => handleServiceChange("prescription", e.target.checked)}
                  disabled={isInterne}
                />
                <span className="service-name">Prescription</span>
                <span className="service-price">-</span>
              </label>
              
              <label className="service-item">
                <input 
                  type="checkbox" 
                  checked={patientVisits.pharmacy_done} 
                  onChange={(e) => handleServiceChange("pharmacy", e.target.checked)}
                  disabled={isInterne}
                />
                <span className="service-name">Pharmacie</span>
                <span className="service-price">-</span>
              </label>
            </div>

            {isInterne && (
              <p className="interne-notice">
                Pour les patients internes, tous les services sont automatiquement cochés et ne peuvent pas être modifiés.
              </p>
            )}

            <button 
              className="modal-close-btn"
              onClick={() => setShowPatientVisitsModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
};
  
export default Patients;
