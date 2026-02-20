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

/**
 * ==========================
 * PAGE PATIENTS
 * CRUD complet avec API Django
 * Sécurisé par JWT
 * ==========================
 */

const Patients = () => {
  
  // 🔐 Récupération du user + token depuis le contexte global
  const { user, token } = useContext(AuthContext);

  // 📋 Liste des patients
  const [patients, setPatients] = useState([]);

  // 📝 Formulaire patient
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "M",
    phone: "",
    email: "",
    address: "",
  });
  console.log("TOKEN:", token);
  console.log("USER:", user);

  // ✏️ ID du patient en cours d'édition
  const [editId, setEditId] = useState(null);

  // 🔄 Affichage du formulaire
  const [showForm, setShowForm] = useState(false);



  /**
   * 📥 Chargement de tous les patients
   * useCallback = stabilité + pas de warning ESLint
   */
  const fetchPatients = useCallback(async () => {
    try {
      const response = await api.get("patients/");
      setPatients(response.data);
    } catch (error) {
      console.error("Erreur récupération patients :", error);
    }
  }, []);

  /**
   * 🔄 Chargement automatique dès que le token existe
   */
  useEffect(() => {
    if (token) fetchPatients();
  }, [token, fetchPatients]);

  /**
   * ➕ / ✏️ Ajouter ou modifier un patient
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        // Modification
        await api.put(`patients/${editId}/`, formData);
      } else {
        // Création
        await api.post("patients/", formData);
      }

      // Reset du formulaire
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "M",
        phone: "",
        email: "",
        address: "",
      });

      setEditId(null);
      setShowForm(false);
      fetchPatients();
    } catch (error) {
      console.error("Erreur sauvegarde patient :", error);
    }
  };

  /**
   * ✏️ Préparer le formulaire pour l’édition
   */
  const handleEdit = (patient) => {
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
    });

    setEditId(patient.id);
    setShowForm(true);
  };

  /**
   * 🗑️ Suppression d’un patient
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await api.delete(`patients/${id}/`);
      fetchPatients();
    } catch (error) {
      console.error("Erreur suppression patient :", error);
    }
  };

  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="patients-container">
        <h1>Gestion des Patients</h1>

        {/* Bouton Ajouter patient en haut du tableau */}
        {["admin", "doctor", "nurse"].includes(user?.role) && (
        <div className="fab-container">
          <button 
          className="fab"
          onClick={() => setShowForm(!showForm)}
          title={showForm ? "Fermer" : "Ajouter un patient"}
          >
         +
          </button>
        </div>
        )}



        {/* 📝 Formulaire */}
        {showForm && (
  <div className="form-container">
    <h2>{editId ? "Modifier le patient" : "Ajouter un patient"}</h2>
    <form className="patient-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Prénom"
        value={formData.first_name}
        onChange={(e) =>
          setFormData({ ...formData, first_name: e.target.value })
        }
        required
      />
      <input
        type="text"
        placeholder="Nom"
        value={formData.last_name}
        onChange={(e) =>
          setFormData({ ...formData, last_name: e.target.value })
        }
        required
      />
      <input
        type="date"
        value={formData.date_of_birth}
        onChange={(e) =>
          setFormData({ ...formData, date_of_birth: e.target.value })
        }
        required
      />
      <select
        value={formData.gender}
        onChange={(e) =>
          setFormData({ ...formData, gender: e.target.value })
        }
      >
        <option value="M">Homme</option>
        <option value="F">Femme</option>
      </select>
      <input
        type="text"
        placeholder="Téléphone"
        value={formData.phone}
        onChange={(e) =>
          setFormData({ ...formData, phone: e.target.value })
        }
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, email: e.target.value })
        }
      />
      <textarea
        placeholder="Adresse"
        value={formData.address}
        onChange={(e) =>
          setFormData({ ...formData, address: e.target.value })
        }
      />
      <button className="edit-btn" type="submit">
        {editId ? "Modifier" : "Ajouter"}
      </button>
    </form>
  </div>
)}


        {/* 📊 Tableau */}
        <table className="patients-table">
          <thead>
            <tr>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Date Naissance</th>
              <th>Genre</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.first_name}</td>
                <td>{p.last_name}</td>
                <td>{p.date_of_birth}</td>
                <td>{p.gender === "M" ? "Homme" : "Femme"}</td>
                <td>{p.phone}</td>
                <td>{p.email}</td>
                <td>{p.address}</td>

                <td>
                  {["admin", "doctor", "nurse"].includes(user?.role) && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
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
  
export default Patients;
