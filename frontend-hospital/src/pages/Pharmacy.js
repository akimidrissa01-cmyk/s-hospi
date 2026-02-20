import React, { useState, useEffect, useCallback, useContext } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Pharmacy.css";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";

const Pharmacy = () => {
  const { token } = useContext(AuthContext);
  
  // 💊 Liste des médicaments
  const [medications, setMedications] = useState([]);
  
  // 📋 Liste des dispensations
  const [dispensations, setDispensations] = useState([]);
  
  // 📝 Formulaire médicament
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    description: "",
    stock_quantity: 0,
    unit_price: "",
    expiry_date: "",
  });
  
  // 📝 Formulaire dispensation
  const [dispensationForm, setDispensationForm] = useState({
    prescription: "",
    medication: "",
    quantity: 1,
  });
  
  // ✏️ ID du médicament en cours d'édition
  const [editMedicationId, setEditMedicationId] = useState(null);
  
  // ✏️ ID de la dispensation en cours d'édition
  const [editDispensationId, setEditDispensationId] = useState(null);
  
  // 🔄 Affichage du formulaire médicament
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  
  // 🔄 Affichage du formulaire dispensation
  const [showDispensationForm, setShowDispensationForm] = useState(false);
  
  // 📋 Liste des prescriptions pour le dropdown
  const [prescriptions, setPrescriptions] = useState([]);

  // 📥 Chargement de tous les médicaments
  const fetchMedications = useCallback(async () => {
    try {
      const response = await api.get("pharmacy/medications/");
      setMedications(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des médicaments:", error);
    }
  }, []);

  // 📥 Chargement de toutes les dispensations
  const fetchDispensations = useCallback(async () => {
    try {
      const response = await api.get("pharmacy/dispensations/");
      setDispensations(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des dispensations:", error);
    }
  }, []);

  // 📥 Chargement des prescriptions pour le dropdown
  const fetchPrescriptions = useCallback(async () => {
    try {
      const response = await api.get("prescriptions/");
      setPrescriptions(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des prescriptions:", error);
    }
  }, []);

  // 🔄 Chargement initial des données
  useEffect(() => {
    if (token) {
      fetchMedications();
      fetchDispensations();
      fetchPrescriptions();
    }
  }, [token, fetchMedications, fetchDispensations, fetchPrescriptions]);

  // 📝 Gestionnaire de changement du formulaire médicament
  const handleMedicationChange = (e) => {
    const { name, value } = e.target;
    setMedicationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 📝 Gestionnaire de changement du formulaire dispensation
  const handleDispensationChange = (e) => {
    const { name, value } = e.target;
    setDispensationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ➕ Créer ou modifier un médicament
  const handleMedicationSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMedicationId) {
        await api.put(`pharmacy/medications/${editMedicationId}/`, medicationForm);
        setEditMedicationId(null);
      } else {
        await api.post("pharmacy/medications/", medicationForm);
      }
      setMedicationForm({
        name: "",
        description: "",
        stock_quantity: 0,
        unit_price: "",
        expiry_date: "",
      });
      setShowMedicationForm(false);
      fetchMedications();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du médicament:", error);
    }
  };

  // ➕ Créer ou modifier une dispensation
  const handleDispensationSubmit = async (e) => {
    e.preventDefault();

    if (
      !dispensationForm.prescription ||
      !dispensationForm.medication ||
      !dispensationForm.quantity
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const medicationId = parseInt(dispensationForm.medication);
    const quantity = parseInt(dispensationForm.quantity);
    
    // Vérifier si le médicament existe et si le stock est suffisant
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      alert("Médicament non trouvé");
      return;
    }
    if (medication.stock_quantity < quantity) {
      alert(`Stock insuffisant! Stock actuel: ${medication.stock_quantity}`);
      return;
    }

    const dataToSend = {
      prescription: parseInt(dispensationForm.prescription),
      medication: medicationId,
      quantity: quantity,
    };

    try {
      if (editDispensationId) {
        await api.put(
          `pharmacy/dispensations/${editDispensationId}/`,
          dataToSend
        );
        setEditDispensationId(null);
      } else {
        await api.post("pharmacy/dispensations/", dataToSend);
        
        // Diminuer le stock du médicament après la création de la dispensation
        const newStock = medication.stock_quantity - quantity;
        await api.put(`pharmacy/medications/${medicationId}/`, {
          ...medication,
          stock_quantity: newStock
        });
      }

      setDispensationForm({
        prescription: "",
        medication: "",
        quantity: 1,
      });

      setShowDispensationForm(false);
      fetchDispensations();
      fetchMedications(); // Recharger les médicaments pour mettre à jour l'affichage
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error.response?.data || error);
      alert("Erreur lors de l'enregistrement de la dispensation");
    }
  };


  // ✏️ Préparer la modification d'un médicament
  const handleEditMedication = (medication) => {
    setMedicationForm({
      name: medication.name,
      description: medication.description || "",
      stock_quantity: medication.stock_quantity,
      unit_price: medication.unit_price,
      expiry_date: medication.expiry_date,
    });
    setEditMedicationId(medication.id);
    setShowMedicationForm(true);
  };

  // ✏️ Préparer la modification d'une dispensation
  const handleEditDispensation = (dispensation) => {
    setDispensationForm({
      prescription: dispensation.prescription,
      medication: dispensation.medication,
      quantity: dispensation.quantity,
    });
    setEditDispensationId(dispensation.id);
    setShowDispensationForm(true);
  };

  // 🗑️ Supprimer un médicament
  const handleDeleteMedication = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce médicament?")) {
      try {
        await api.delete(`pharmacy/medications/${id}/`);
        fetchMedications();
      } catch (error) {
        console.error("Erreur lors de la suppression du médicament:", error);
      }
    }
  };

  // 🗑️ Supprimer une dispensation
  const handleDeleteDispensation = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette dispensation?")) {
      try {
        await api.delete(`pharmacy/dispensations/${id}/`);
        fetchDispensations();
      } catch (error) {
        console.error("Erreur lors de la suppression de la dispensation:", error);
      }
    }
  };

  return (
    <div className="pharmacy-container">
      <Sidebar />
      <Navbar />
        <div className="pharmacy-header">
          <h1>Pharmacie</h1>
        </div>
        
        {/* Section Médicaments */}
        <div className="pharmacy-section">
          <div className="section-header">
            <h2>Médicaments</h2>
            <button 
              className="add-btn"
              onClick={() => {
                setShowMedicationForm(!showMedicationForm);
                setEditMedicationId(null);
                setMedicationForm({
                  name: "",
                  description: "",
                  stock_quantity: 0,
                  unit_price: "",
                  expiry_date: "",
                });
              }}
            >
              {showMedicationForm ? "Annuler" : "+ Ajouter un médicament"}
            </button>
          </div>
          
          {showMedicationForm && (
            <div className="form-container">
              <form className="pharmacy-form" onSubmit={handleMedicationSubmit}>
                <div className="form-group">
                  <label>Nom du médicament:</label>
                  <input
                    type="text"
                    name="name"
                    value={medicationForm.name}
                    onChange={handleMedicationChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    name="description"
                    value={medicationForm.description}
                    onChange={handleMedicationChange}
                  />
                </div>
                <div className="form-group">
                  <label>Quantité en stock:</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={medicationForm.stock_quantity}
                    onChange={handleMedicationChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Prix unitaire:</label>
                  <input
                    type="number"
                    name="unit_price"
                    value={medicationForm.unit_price}
                    onChange={handleMedicationChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date d'expiration:</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={medicationForm.expiry_date}
                    onChange={handleMedicationChange}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editMedicationId ? "Modifier" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Cartes des médicaments */}
          <div className="medication-cards-container">
            {medications.map((medication) => (
              <div className="medication-card" key={medication.id}>
                <div className="medication-card-header">
                  <span className="medication-card-icon">💊</span>
                  <h3>{medication.name}</h3>
                  <span className={`stock-badge ${medication.stock_quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                    {medication.stock_quantity} en stock
                  </span>
                </div>
                <div className="medication-card-body">
                  <div className="medication-card-info">
                    <span className="medication-card-label">Description:</span>
                    <span className="medication-card-value">
                      {medication.description || 'Aucune description'}
                    </span>
                  </div>
                  <div className="medication-card-info">
                    <span className="medication-card-label">Prix:</span>
                    <span className="medication-card-value">{medication.unit_price} €</span>
                  </div>
                  <div className="medication-card-info">
                    <span className="medication-card-label">Expiration:</span>
                    <span className="medication-card-value">{medication.expiry_date}</span>
                  </div>
                </div>
                <div className="medication-card-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditMedication(medication)}
                  >
                    Modifier
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteMedication(medication.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {medications.length === 0 && (
            <div className="no-data">
              <span className="no-data-icon">💊</span>
              <p>Aucun médicament trouvé</p>
              <p className="no-data-subtitle">Cliquez sur "Ajouter un médicament" pour commencer</p>
            </div>
          )}
        </div>
        
        {/* Section Dispensations */}
        <div className="pharmacy-section">
          <div className="section-header">
            <h2>Dispensations</h2>
            <button 
              className="add-btn"
              onClick={() => {
                setShowDispensationForm(!showDispensationForm);
                setEditDispensationId(null);
                setDispensationForm({
                  prescription: "",
                  medication: "",
                  quantity: 1,
                });
              }}
            >
              {showDispensationForm ? "Annuler" : "+ Nouvelle dispensation"}
            </button>
          </div>
          
          {showDispensationForm && (
            <div className="form-container">
              <form className="pharmacy-form" onSubmit={handleDispensationSubmit}>
                <div className="form-group">
                  <label>Prescription:</label>
                  <select
                    name="prescription"
                    value={dispensationForm.prescription}
                    onChange={handleDispensationChange}
                    required
                  >
                    <option value="">Sélectionner une prescription</option>
                    {prescriptions.map((prescription) => (
                      <option key={prescription.id} value={prescription.id}>
                        Prescription #{prescription.id} - {prescription.patient}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Médicament:</label>
                  <select
                    name="medication"
                    value={dispensationForm.medication}
                    onChange={handleDispensationChange}
                    required
                  >
                    <option value="">Sélectionner un médicament</option>
                    {medications.map((medication) => (
                      <option key={medication.id} value={medication.id}>
                        {medication.name} (Stock: {medication.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité:</label>
                  <input
                    type="number"
                    name="quantity"
                    value={dispensationForm.quantity}
                    onChange={handleDispensationChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editDispensationId ? "Modifier" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Cartes des dispensations */}
          <div className="dispensation-cards-container">
            {dispensations.map((dispensation) => (
              <div className="dispensation-card" key={dispensation.id}>
                <div className="dispensation-card-header">
                  <span className="dispensation-card-icon">📋</span>
                  <h3>Dispensation #{dispensation.id}</h3>
                </div>
                <div className="dispensation-card-body">
                  <div className="dispensation-card-info">
                    <span className="dispensation-card-label">Prescription:</span>
                    <span className="dispensation-card-value">#{dispensation.prescription}</span>
                  </div>
                  <div className="dispensation-card-info">
                    <span className="dispensation-card-label">Médicament:</span>
                    <span className="dispensation-card-value">
                      {dispensation.medication_name || dispensation.medication}
                    </span>
                  </div>
                  <div className="dispensation-card-info">
                    <span className="dispensation-card-label">Quantité:</span>
                    <span className="dispensation-card-value">{dispensation.quantity}</span>
                  </div>
                  <div className="dispensation-card-info">
                    <span className="dispensation-card-label">Date:</span>
                    <span className="dispensation-card-value">{dispensation.dispensed_at}</span>
                  </div>
                </div>
                <div className="dispensation-card-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditDispensation(dispensation)}
                  >
                    Modifier
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteDispensation(dispensation.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {dispensations.length === 0 && (
            <div className="no-data">
              <span className="no-data-icon">📋</span>
              <p>Aucune dispensation trouvée</p>
              <p className="no-data-subtitle">Cliquez sur "Nouvelle dispensation" pour commencer</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default Pharmacy;
