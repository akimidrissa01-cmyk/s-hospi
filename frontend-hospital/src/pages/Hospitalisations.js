import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import RoomTab from "./RoomTab";
import NursingTab from "./NursingTab";
import ServicesTab from "./ServicesTab";
import DischargeTab from "./DischargeTab";
import "./Hospitalisations.css";

const Hospitalisations = () => {
  const [activeTab, setActiveTab] = useState("room");

  const renderTabContent = () => {
    switch (activeTab) {
      case "room":
        return <RoomTab />;
      case "nursing":
        return <NursingTab />;
      case "services":
        return <ServicesTab />;
      case "discharge":
        return <DischargeTab />;
      default:
        return <RoomTab />;
    }
  };

  return (
    <>
      <Sidebar />
      <Navbar />
      <div className="hospitalisations-container">
        <h1>Gestion des Hospitalisations</h1>
        <div className="tabs">
          <button
            className={activeTab === "room" ? "tab active" : "tab"}
            onClick={() => setActiveTab("room")}
          >
            Gestion des Chambres
          </button>
          <button
            className={activeTab === "nursing" ? "tab active" : "tab"}
            onClick={() => setActiveTab("nursing")}
          >
            Soins Infirmiers
          </button>
          <button
            className={activeTab === "services" ? "tab active" : "tab"}
            onClick={() => setActiveTab("services")}
          >
            Services Médicaux
          </button>
          <button
            className={activeTab === "discharge" ? "tab active" : "tab"}
            onClick={() => setActiveTab("discharge")}
          >
            Sortie
          </button>
        </div>
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default Hospitalisations;
