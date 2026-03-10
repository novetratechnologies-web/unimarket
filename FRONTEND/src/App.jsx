// src/App.jsx
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
import Settings from './pages/settings/Settings';
import CategoryPage from './pages/categories/CategoryPage'

function App() {
  const location = useLocation();

  // Routes where header/footer should be hidden
  const hideLayoutPaths = [
    "/register", 
    "/login", 
    "/verify-email",
    "/auth-success",
    "/update-info",
    "/forgot-password",
  ];

  const shouldHideLayout = hideLayoutPaths.some(path => 
    location.pathname.startsWith(path)
  );

  const isNotFoundPage = location.pathname === "*" || location.pathname === "/404";

  return (
    <AuthProvider>
      <FullScreenAnnouncement />
      
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex flex-col">
        {!shouldHideLayout && !isNotFoundPage && <Header />}

        <main className="flex-grow">
          <Routes>
            {/* ===== PUBLIC PAGES (No Login Required) ===== */}
            <Route path="/" element={<Home />} />
            
            {/* Add more public pages here as you create them */}
            {/* <Route path="/products" element={<ProductListing />} /> */}
            {/* <Route path="/product/:slug" element={<ProductDetails />} /> */}
            <Route path="/category/*" element={<CategoryPage />} />
            {/* <Route path="/about" element={<About />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}

            {/* ===== AUTH PAGES (No Header/Footer) ===== */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/update-info" element={<UpdateInfo />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ===== PROTECTED PAGES (Login Required) ===== */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Add more protected pages here as you create them */}
            {/* <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            /> */}

            {/* ===== 404 PAGE ===== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {!shouldHideLayout && !isNotFoundPage && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;