import { useLayoutEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { clearSession, getDefaultRoute, readSession } from "./api/authStore";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ReaderLayout from "./components/ReaderLayout";
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
import LoanWorkflow from "./pages/LoanWorkflow";
import Media from "./pages/Media";
import Publishers from "./pages/Publishers";
import Reader, { ReaderCard, ReaderFavorites, ReaderFines, ReaderOrders, ReaderReturns } from "./pages/Reader";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import AdminMemberships from "./pages/AdminMemberships";
import Plans from "./pages/Plans";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    function resetScroll() {
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      root.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    resetScroll();
    const frame = window.requestAnimationFrame(() => {
      resetScroll();
      root.style.scrollBehavior = previousBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousBehavior;
    };
  }, [pathname, search]);

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
        <Route path="/plans" element={<Plans session={session} onLogout={handleLogout} />} />
        <Route
          path="/login"
          element={session ? <Navigate to={defaultProtectedPath} replace /> : <Login onLogin={handleLogin} />}
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
            <ProtectedRoute session={session} roles={["READER"]}>
              <ReaderLayout session={session} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/reader"
            element={<Reader session={session} onSessionUpdate={handleLogin} />}
          />
          <Route
            path="/reader/orders"
            element={<ReaderOrders session={session} />}
          />
          <Route
            path="/reader/returns"
            element={<ReaderReturns session={session} />}
          />
          <Route
            path="/reader/fines"
            element={<ReaderFines session={session} />}
          />
          <Route
            path="/reader/favorites"
            element={<ReaderFavorites session={session} />}
          />
          <Route
            path="/reader/card"
            element={<ReaderCard session={session} onSessionUpdate={handleLogin} />}
          />
          <Route
            path="/reader/cart"
            element={<Cart session={session} onLogout={handleLogout} />}
          />
          <Route
            path="/reader/notifications"
            element={<Notifications />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute session={session}>
              <AppLayout session={session} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/cart"
            element={<Navigate to="/reader/cart" replace />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/pickup"
            element={
              <ProtectedRoute session={session} roles={["LIBRARIAN"]}>
                <LoanWorkflow mode="PICKUP" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/delivery"
            element={
              <ProtectedRoute session={session} roles={["LIBRARIAN"]}>
                <LoanWorkflow mode="DELIVERY" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kyc"
            element={
              <ProtectedRoute session={session} roles={["LIBRARIAN"]}>
                <AdminKyc />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute session={session} roles={["LIBRARIAN"]}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fines"
            element={
              <ProtectedRoute session={session} roles={["LIBRARIAN"]}>
                <AdminFines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Books />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authors"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Authors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publishers"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Publishers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media"
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <Media />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/memberships" 
            element={
              <ProtectedRoute session={session} roles={["ADMIN"]}>
                <AdminMemberships />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute session={session} roles={["ADMIN", "LIBRARIAN"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="/operations" element={<Navigate to="/loans/pickup" replace />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute session={session} roles={session?.role === "READER" ? undefined : ["LIBRARIAN"]}>
              {session?.role === "READER" ? <Navigate to="/reader/notifications" replace /> : <Notifications />}
            </ProtectedRoute>
          }
        />
        </Route>

        <Route path="*" element={<Navigate to={defaultProtectedPath} replace />} />
      </Routes>
    </>
  );
}
