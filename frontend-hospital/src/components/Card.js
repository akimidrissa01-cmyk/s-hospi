import React from "react";
import "./Card.css";

const Card = ({ title, value }) => {
  return (
    <div className="card">
      <h4 className="card-title">{title}</h4>
      <p className="card-value">{value}</p>
    </div>
  );
};

export default Card;
