// src/App.jsx - UPDATED WITH FULLSCREEN ANNOUNCEMENT
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/layout/header/Navbar";
import Home from "./pages/home/Home";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import AuthSuccess from "./pages/auth/AuthSuccess";
import VerifyEmail from "./pages/auth/VerifyEmail";
import NotFound from "./pages/errors/NotFound";
import Footer from "./components/layout/footer/Footer";
import UpdateInfo from "./pages/auth/UpdateInfo";
import ForgotPassword from "./pages/auth/ForgotPassword";
import FullScreenAnnouncement from "./components/layout/FullScreenAnnouncement";

function App() {
  const location = useLocation();

  // Routes where header/footer should be hidden (only auth pages)
  const hideLayoutPaths = [
    "/register", 
    "/login", 
    "/verify-email",
    "/auth/success",
    "/update-info",
    "/forgot-password",
  ];

  // Check if current path should hide layout
  const shouldHideLayout = hideLayoutPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // Check if it's a 404 page (show minimal layout for 404)
  const isNotFoundPage = location.pathname === "*" || 
                         location.pathname === "/404" || 
                         location.pathname.includes("not-found");

  return (
    <AuthProvider>
      {/* Full-screen announcement that appears after login */}
      <FullScreenAnnouncement />
      
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex flex-col">
        {/* Show header for all pages EXCEPT auth pages and 404 */}
        {!shouldHideLayout && !isNotFoundPage && <Header />}

        <main className="flex-grow">
          <Routes>
            {/* ===== AUTH PAGES (No Header/Footer) ===== */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/update-info" element={<UpdateInfo />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ===== MAIN PAGES (With Header/Footer) ===== */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* ===== 404 PAGE (Minimal Layout) ===== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Show footer for all pages EXCEPT auth pages and 404 */}
        {!shouldHideLayout && !isNotFoundPage && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;