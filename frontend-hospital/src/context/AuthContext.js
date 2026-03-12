import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// 🔹 Création du contexte Auth pour partager user et token
const AuthContext = createContext({
  user: null,       // info utilisateur (username, role)
  token: null,      // JWT pour les requêtes
  login: async () => {}, // fonction login
  logout: () => {},      // fonction logout
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // stocke info utilisateur
  const [token, setToken] = useState(null); // stocke JWT

  // 🔹 Au démarrage, charger token depuis localStorage si présent
  useEffect(() => {
    const savedToken = localStorage.getItem("access") || localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      const payload = parseJWT(savedToken);
      setUser({ username: payload.username, role: payload.role });
    }
  }, []);

  // 🔹 Fonction pour parser le JWT et récupérer les infos utilisateur
  const parseJWT = (jwt) => {
    try {
      const base64Payload = jwt.split(".")[1];         // récupérer la partie payload
      const payload = JSON.parse(atob(base64Payload)); // décoder Base64
      return payload;
    } catch (err) {
      console.error("JWT parsing error:", err);
      return {};
    }
  };

  // 🔹 Login : récupère le token depuis backend et stocke user & token
  const login = async (username, password) => {
    try {
      const res = await axios.post("/api/token/", {
        username,
        password,
      });

      const access = res.data.access;
      const refresh = res.data.refresh;
      setToken(access);                  // stocker token dans state
      localStorage.setItem("access", access); // stocker access token
      localStorage.setItem("refresh", refresh); // stocker refresh token

      const payload = parseJWT(access);  // extraire infos utilisateur
      setUser({ 
        id: payload.user_id, 
        username: payload.username, 
        role: payload.role 
      });

      return true; // login réussi
    } catch (err) {
      console.error("Login error:", err);
      return false; // login échoué
    }
  };

  // 🔹 Logout : supprime token et user
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
