import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./auth/AuthPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import Menu from "../pages/Menu";
import AdminPanel from "./admin/AdminPanel";
import Logout from "./auth/Logout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH (LOGIN + REGISTER) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* LOGOUT */}
        <Route path="/logout" element={<Logout />} />

        {/* USER PAGE */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />

        {/* ADMIN PAGE */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
