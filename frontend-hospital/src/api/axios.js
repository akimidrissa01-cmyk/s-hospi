import axios from "axios";

/*
  On crée une instance axios pour centraliser
  toutes les requêtes vers le backend Django.
*/

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
  Intercepteur :
  Ce code s'exécute AVANT chaque requête HTTP.
  Il permet d'ajouter automatiquement le token JWT
  dans les headers pour sécuriser les appels API.
*/

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
  Intercepteur de réponse :
  Si 401 (Unauthorized), tente de rafraîchir le token avec le refresh token.
  Si réussi, relance la requête originale avec le nouveau token.
  Sinon, rejette l'erreur.
*/

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh");
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
            refresh: refreshToken,
          });

          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem("access", newAccessToken);

          // Mettre à jour le header Authorization de la requête originale
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Relancer la requête originale
          return instance(originalRequest);
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement du token:", refreshError);
          // Si le refresh échoue, supprimer les tokens et rediriger vers login
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          window.location.href = "/"; // Rediriger vers la page de login
        }
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
