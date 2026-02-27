import React, { useState, useEffect, useContext, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import "./RoomTab.css";

const RoomTab = () => {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  
  // Active tab
  const [activeTab, setActiveTab] = useState("rooms");

  const fetchRooms = useCallback(async () => {
    try {
      let url = "roomtab/rooms/";
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (floorFilter) params.push(`floor=${floorFilter}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      
      const res = await api.get(url);
      setRooms(res.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }, [statusFilter, floorFilter]);

  const fetchEligiblePatients = useCallback(async () => {
    try {
      const res = await api.get("roomtab/beds/eligible_patients/");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching eligible patients:", err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get("roomtab/assignments/?active_only=true");
      setAssignments(res.data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  }, []);

  const fetchHistory = useCallback(async (roomId = null) => {
    try {
      let url = "roomtab/assignments/history/?limit=50";
      if (roomId) url += `&bed_id=${roomId}`;
      const res = await api.get(url);
      setAssignmentHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchRooms();
      fetchEligiblePatients();
      fetchAssignments();
    }
  }, [token, fetchRooms, fetchEligiblePatients, fetchAssignments]);

  // Filter rooms based on active filters
  const filteredRooms = rooms;

  // Get stats
  const stats = {
    total: rooms.length,
    free: rooms.filter(r => r.status === "free").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
  };

  const handleAssignClick = (room, bed) => {
    setSelectedRoom(room);
    setSelectedBed(bed);
    setShowAssignModal(true);
  };

  const handleTransferClick = (room, bed) => {
    setSelectedRoom(room);
    setSelectedBed(bed);
    setShowTransferModal(true);
  };

  const handleHistoryClick = (room) => {
    setSelectedRoom(room);
    fetchHistory(room.id);
    setShowHistoryModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`roomtab/beds/${selectedBed.id}/assign_patient/`, {
        patient_id: selectedPatient,
      });
      setShowAssignModal(false);
      setSelectedPatient("");
      fetchRooms();
      fetchAssignments();
    } catch (err) {
      console.error("Error assigning patient:", err);
      alert(err.response?.data?.error || "Erreur lors de l'attribution");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      // Find current assignment
      const assignment = assignments.find(a => a.bed === selectedBed.id);
      if (assignment) {
        await api.post(`roomtab/assignments/${assignment.id}/transfer/`, {
          new_bed_id: selectedPatient,
        });
      }
      setShowTransferModal(false);
      setSelectedPatient("");
      fetchRooms();
      fetchAssignments();
    } catch (err) {
      console.error("Error transferring patient:", err);
      alert(err.response?.data?.error || "Erreur lors du transfert");
    }
  };

  const handleDischarge = async (bedId) => {
    if (!window.confirm("Confirmer la sortie du patient?")) return;
    try {
      await api.post(`roomtab/beds/${bedId}/discharge_patient/`);
      fetchRooms();
      fetchAssignments();
    } catch (err) {
      console.error("Error discharging patient:", err);
    }
  };

  const handleMarkClean = async (bedId) => {
    try {
      await api.post(`roomtab/beds/${bedId}/mark_cleaning_done/`);
      fetchRooms();
    } catch (err) {
      console.error("Error marking cleaning done:", err);
    }
  };

  // Get available beds for transfer
  const availableBeds = rooms.flatMap(room => 
    room.beds
      .filter(bed => bed.status === "free" && bed.id !== selectedBed?.id)
      .map(bed => ({ ...bed, roomNumber: room.room_number }))
  );

  const getStatusColor = (status) => {
    const colors = {
      free: "#10b981",
      occupied: "#ef4444",
      cleaning: "#f59e0b",
      maintenance: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      free: "Libre",
      occupied: "Occupée",
      cleaning: "Nettoyage",
      maintenance: "Maintenance",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
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
      
      <div className="room-tab-container">
        <div className="room-tab-header">
          <h1>🏥 Gestion des Chambres</h1>
          
          {/* Stats Cards */}
          <div className="room-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card free">
              <span className="stat-number">{stats.free}</span>
              <span className="stat-label">Libres</span>
            </div>
            <div className="stat-card occupied">
              <span className="stat-number">{stats.occupied}</span>
              <span className="stat-label">Occupées</span>
            </div>
            <div className="stat-card cleaning">
              <span className="stat-number">{stats.cleaning}</span>
              <span className="stat-label">Nettoyage</span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="room-filters">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="free">Libre</option>
              <option value="occupied">Occupée</option>
              <option value="cleaning">Nettoyage</option>
              <option value="maintenance">Maintenance</option>
            </select>
            
            <select 
              value={floorFilter} 
              onChange={(e) => setFloorFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les étages</option>
              <option value="1">Étage 1</option>
              <option value="2">Étage 2</option>
              <option value="3">Étage 3</option>
              <option value="4">Étage 4</option>
              <option value="5">Étage 5</option>
            </select>
          </div>
          
          {/* Tabs */}
          <div className="room-tabs">
            <button 
              className={`room-tab ${activeTab === "rooms" ? "active" : ""}`}
              onClick={() => setActiveTab("rooms")}
            >
              Chambres
            </button>
            <button 
              className={`room-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("history");
                fetchHistory();
              }}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Rooms Grid - Card Design (Not Table!) */}
        {activeTab === "rooms" && (
          <div className="rooms-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card-header">
                  <div className="room-info">
                    <h3>Chambre {room.room_number}</h3>
                    <span className="room-floor">Étage {room.floor}</span>
                  </div>
                  <div 
                    className="room-status-badge"
                    style={{ backgroundColor: getStatusColor(room.status) }}
                  >
                    {getStatusLabel(room.status)}
                  </div>
                </div>
                
                <div className="room-type">
                  {room.room_type_display}
                </div>
                
                <div className="room-beds">
                  {room.beds.map((bed) => (
                    <div 
                      key={bed.id} 
                      className={`bed-item ${bed.status}`}
                    >
                      <div className="bed-info">
                        <span className="bed-number">Lit {bed.bed_number}</span>
                        {bed.patient_name && (
                          <span className="patient-name">{bed.patient_name}</span>
                        )}
                      </div>
                      <div className="bed-status">
                        <span 
                          className="bed-status-dot"
                          style={{ backgroundColor: getStatusColor(bed.status) }}
                        />
                        <span className="bed-status-text">
                          {getStatusLabel(bed.status)}
                        </span>
                      </div>
                      <div className="bed-actions">
                        {bed.status === "free" && user?.role === "admin" && (
                          <button 
                            className="action-btn assign"
                            onClick={() => handleAssignClick(room, bed)}
                            title="Attribuer"
                          >
                            +
                          </button>
                        )}
                        {bed.status === "occupied" && user?.role === "admin" && (
                          <>
                            <button 
                              className="action-btn transfer"
                              onClick={() => handleTransferClick(room, bed)}
                              title="Transférer"
                            >
                              ⇄
                            </button>
                            <button 
                              className="action-btn discharge"
                              onClick={() => handleDischarge(bed.id)}
                              title="Sortie"
                            >
                              ⊖
                            </button>
                          </>
                        )}
                        {bed.status === "cleaning" && user?.role === "admin" && (
                          <button 
                            className="action-btn clean"
                            onClick={() => handleMarkClean(bed.id)}
                            title="Marquer nettoyer"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="room-card-footer">
                  <button 
                    className="history-btn"
                    onClick={() => handleHistoryClick(room)}
                  >
                    📋 Historique
                  </button>
                  <span className="room-price">
                    {room.price_per_day}€/jour
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="history-section">
            <div className="history-list">
              {assignmentHistory.length > 0 ? (
                assignmentHistory.map((assignment) => (
                  <div key={assignment.id} className="history-item">
                    <div className="history-icon">
                      {assignment.assignment_type === "admission" && "🏥"}
                      {assignment.assignment_type === "transfer" && "⇄"}
                      {assignment.assignment_type === "discharge" && "🚪"}
                    </div>
                    <div className="history-content">
                      <div className="history-patient">
                        {assignment.patient_name}
                      </div>
                      <div className="history-details">
                        {assignment.assignment_type === "admission" && "Admission - "}
                        {assignment.assignment_type === "transfer" && "Transfert vers - "}
                        {assignment.assignment_type === "discharge" && "Sortie de - "}
                        Chambre {assignment.room_number}, Lit {assignment.bed_number}
                      </div>
                      <div className="history-meta">
                        <span>Par: {assignment.assigned_by_name || " Système"}</span>
                        <span>Le: {formatDate(assignment.assigned_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-history">Aucun historique</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Attribuer une chambre</h2>
            <div className="modal-info">
              <p>Chambre: <strong>{selectedRoom?.room_number}</strong></p>
              <p>Lit: <strong>{selectedBed?.bed_number}</strong></p>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Patient</label>
                <select 
                  value={selectedPatient} 
                  onChange={(e) => setSelectedPatient(e.target.value)}
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
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAssignModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Transférer le patient</h2>
            <div className="modal-info">
              <p>Chambre actuelle: <strong>{selectedRoom?.room_number}</strong></p>
              <p>Lit actuel: <strong>{selectedBed?.bed_number}</strong></p>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>Nouvelle chambre/lit</label>
                <select 
                  value={selectedPatient} 
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                >
                  <option value="">Sélectionner une nouvelle chambre</option>
                  {availableBeds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      Chambre {bed.roomNumber} - Lit {bed.bed_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowTransferModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  Transférer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>Historique - Chambre {selectedRoom?.room_number}</h2>
            <div className="history-list">
              {assignmentHistory.length > 0 ? (
                assignmentHistory.map((assignment) => (
                  <div key={assignment.id} className="history-item">
                    <div className="history-icon">
                      {assignment.assignment_type === "admission" && "🏥"}
                      {assignment.assignment_type === "transfer" && "⇄"}
                      {assignment.assignment_type === "discharge" && "🚪"}
                    </div>
                    <div className="history-content">
                      <div className="history-patient">
                        {assignment.patient_name}
                      </div>
                      <div className="history-details">
                        {assignment.assignment_type === "admission" && "Admission"}
                        {assignment.assignment_type === "transfer" && "Transfert"}
                        {assignment.assignment_type === "discharge" && "Sortie"}
                        {" - "}Chambre {assignment.room_number}, Lit {assignment.bed_number}
                      </div>
                      <div className="history-meta">
                        <span>Par: {assignment.assigned_by_name || "Système"}</span>
                        <span>Le: {formatDate(assignment.assigned_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-history">Aucun historique pour cette chambre</div>
              )}
            </div>
            <button 
              className="modal-close-btn"
              onClick={() => setShowHistoryModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTab;
