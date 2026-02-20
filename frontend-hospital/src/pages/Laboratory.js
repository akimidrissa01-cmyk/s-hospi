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
   * 🔄 Chargement automatique dès que le token existe
   */
  useEffect(() => {
    if (token) {
      fetchLabTests();
      fetchPatients();
    }
  }, [token, fetchLabTests, fetchPatients]);

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
        alert("Erreur de validation. Veuillez vérifier les champs.");
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

  // Fonction pour obtenir le nom du patient
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${patientId}`;
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
          
          {/* Bouton Ajouter test */}
          {["admin", "lab"].includes(user?.role) && (
            <button
              className="add-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Fermer" : "+ Nouveau Test"}
            </button>
          )}
        </div>

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
