import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import Patients from "./pages/Patients";
import Consultations from "./pages/Consultations";
import Prescriptions from "./pages/Prescriptions";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import Billing from "./pages/Billing";

/*
  Ce fichier définit toutes les routes
  de l'application React.
*/

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/laboratory" element={<Laboratory />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
