import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import "./Billing.css";

const Billing = () => {
  const [activeTab, setActiveTab] = useState("bills");
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showBillForm, setShowBillForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newBill, setNewBill] = useState({
    patient: "",
    consultation: "",
    total_amount: "",
    due_date: "",
  });
  const [newPayment, setNewPayment] = useState({
    bill: "",
    amount: "",
    payment_method: "cash",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, paymentsRes, patientsRes] = await Promise.all([
        api.get("billing/bills/"),
        api.get("billing/payments/"),
        api.get("patients/"),
      ]);
      setBills(billsRes.data);
      setPayments(paymentsRes.data);
      setPatients(patientsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching billing data:", err);
      setError("Erreur lors du chargement des données de facturation");
      setLoading(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.post("billing/bills/", newBill);
      setShowBillForm(false);
      setNewBill({
        patient: "",
        consultation: "",
        total_amount: "",
        due_date: "",
      });
      fetchData();
    } catch (err) {
      console.error("Error creating bill:", err);
      setError("Erreur lors de la création de la facture");
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post("billing/payments/", newPayment);
      setShowPaymentForm(false);
      setNewPayment({
        bill: "",
        amount: "",
        payment_method: "cash",
      });
      fetchData();
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Erreur lors de la création du paiement");
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return;
    }
    try {
      await api.delete(`billing/bills/${id}/`);
      fetchData();
    } catch (err) {
      console.error("Error deleting bill:", err);
      setError("Erreur lors de la suppression de la facture");
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      return;
    }
    try {
      await api.delete(`billing/payments/${id}/`);
      fetchData();
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError("Erreur lors de la suppression du paiement");
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${patientId}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-paid";
      case "pending":
        return "status-pending";
      case "overdue":
        return "status-overdue";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <Navbar />
        <div className="billing-content">
          <h1>Facturation</h1>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Sidebar />
        <Navbar />
        <div className="billing-content">
          <h1>Facturation</h1>
          <p className="error">{error}</p>
          <button onClick={fetchData}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />
      <Navbar />
      <div className="billing-content">
        <h1>Facturation</h1>
        
        <div className="tabs">
          <button
            className={`tab ${activeTab === "bills" ? "active" : ""}`}
            onClick={() => setActiveTab("bills")}
          >
            Factures ({bills.length})
          </button>
          <button
            className={`tab ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Paiements ({payments.length})
          </button>
        </div>

        {activeTab === "bills" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Liste des factures</h2>
              <button
                className="btn-primary"
                onClick={() => setShowBillForm(!showBillForm)}
              >
                {showBillForm ? "Annuler" : "Nouvelle facture"}
              </button>
            </div>

            {showBillForm && (
              <form className="form-container" onSubmit={handleCreateBill}>
                <h3>Créer une nouvelle facture</h3>
                <div className="form-group">
                  <label>Patient:</label>
                  <select
                    value={newBill.patient}
                    onChange={(e) =>
                      setNewBill({ ...newBill, patient: e.target.value })
                    }
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Montant total:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBill.total_amount}
                    onChange={(e) =>
                      setNewBill({ ...newBill, total_amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date d'échéance:</label>
                  <input
                    type="date"
                    value={newBill.due_date}
                    onChange={(e) =>
                      setNewBill({ ...newBill, due_date: e.target.value })
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn-success">
                  Créer la facture
                </button>
              </form>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Montant total</th>
                  <th>Montant payé</th>
                  <th>Statut</th>
                  <th>Date d'échéance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="6">Aucune facture trouvée</td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{getPatientName(bill.patient)}</td>
                      <td>{bill.total_amount} €</td>
                      <td>{bill.paid_amount} €</td>
                      <td>
                        <span className={`status ${getStatusClass(bill.status)}`}>
                          {bill.status === "paid"
                            ? "Payé"
                            : bill.status === "pending"
                            ? "En attente"
                            : "En retard"}
                        </span>
                      </td>
                      <td>{bill.due_date}</td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteBill(bill.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Liste des paiements</h2>
              <button
                className="btn-primary"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                {showPaymentForm ? "Annuler" : "Nouveau paiement"}
              </button>
            </div>

            {showPaymentForm && (
              <form className="form-container" onSubmit={handleCreatePayment}>
                <h3>Enregistrer un nouveau paiement</h3>
                <div className="form-group">
                  <label>Facture:</label>
                  <select
                    value={newPayment.bill}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, bill: e.target.value })
                    }
                    required
                  >
                    <option value="">Sélectionner une facture</option>
                    {bills.map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {getPatientName(bill.patient)} - {bill.total_amount} €
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Montant:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Méthode de paiement:</label>
                  <select
                    value={newPayment.payment_method}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        payment_method: e.target.value,
                      })
                    }
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte</option>
                    <option value="insurance">Assurance</option>
                  </select>
                </div>
                <button type="submit" className="btn-success">
                  Enregistrer le paiement
                </button>
              </form>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="5">Aucun paiement trouvé</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>Facture #{payment.bill}</td>
                      <td>{payment.amount} €</td>
                      <td>
                        {payment.payment_method === "cash"
                          ? "Espèces"
                          : payment.payment_method === "card"
                          ? "Carte"
                          : "Assurance"}
                      </td>
                      <td>
                        {new Date(payment.payment_date).toLocaleDateString(
                          "fr-FR"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
