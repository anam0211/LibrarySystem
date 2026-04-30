import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { clearSession, getDefaultRoute, readSession } from "./api/authStore";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminFines from "./pages/AdminFines";
import AdminKyc from "./pages/AdminKyc";
import AdminReviews from "./pages/AdminReviews";
import Authors from "./pages/Authors";
import BookDetail from "./pages/BookDetail";
import Books from "./pages/Books";
import Booking from "./pages/Booking";
import Cart from "./pages/Cart";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Media from "./pages/Media";
import Publishers from "./pages/Publishers";
import Reader from "./pages/Reader";
import Users from "./pages/Users";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

export default function App() {
  const [session, setSession] = useState(() => readSession());

  function handleLogin(nextSession) {
    setSession(nextSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  const defaultProtectedPath = session ? getDefaultRoute(session.role) : "/";

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home session={session} onLogout={handleLogout} />} />
        <Route path="/leaderboard" element={<Leaderboard session={session} onLogout={handleLogout} />} />
        <Route path="/book/:bookId" element={<BookDetail session={session} onLogout={handleLogout} />} />
        <Route
          path="/login"
          element={session ? <Navigate to={defaultProtectedPath} replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute session={session} roles={["READER"]}>
              <Cart session={session} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:bookId"
          element={
            <ProtectedRoute session={session} roles={["READER", "ADMIN", "LIBRARIAN"]}>
              <Booking session={session} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute session={session}>
              <AppLayout session={session} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/reader"
            element={
              <ProtectedRoute session={session} roles={["READER", "ADMIN", "LIBRARIAN"]}>
                <Reader session={session} onSessionUpdate={handleLogin} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kyc"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <AdminKyc />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fines"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <AdminFines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Books />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authors"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Authors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publishers"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Publishers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Media />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="/operations" element={<Navigate to="/dashboard" replace />} />
          <Route path="/notifications" element={<Navigate to="/reader" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={defaultProtectedPath} replace />} />
      </Routes>
    </>
  );
}
