import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AuthLayout from './components/common/AuthLayout.jsx';
import AdminLayout from './components/common/AdminLayout.jsx';
import VendorLayout from './components/common/VendorLayout.jsx';
import UserLayout from './components/common/UserLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Skeleton from './components/common/Skeleton.jsx';
import {
  fetchCurrentUser,
  selectIsAuthenticated,
  selectAuthInitialized,
  selectUserRole,
} from './store/slices/authSlice.js';

// Lazy-loaded pages for code splitting
const Home           = lazy(() => import('./pages/Home.jsx'));
const Products       = lazy(() => import('./pages/Products.jsx'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail.jsx'));
const Cart           = lazy(() => import('./pages/Cart.jsx'));
const Wishlist       = lazy(() => import('./pages/Wishlist.jsx'));
const Checkout       = lazy(() => import('./pages/Checkout.jsx'));
const Orders         = lazy(() => import('./pages/Orders.jsx'));
const OrderTracking  = lazy(() => import('./pages/OrderTracking.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminVendors   = lazy(() => import('./pages/AdminVendors.jsx'));
const AdminProducts  = lazy(() => import('./pages/AdminProducts.jsx'));
const AdminUsers     = lazy(() => import('./pages/AdminUsers.jsx'));
const AdminOrders    = lazy(() => import('./pages/AdminOrders.jsx'));
const AdminSettings  = lazy(() => import('./pages/AdminSettings.jsx'));
const AdminProfile   = lazy(() => import('./pages/AdminProfile.jsx'));
const VendorDashboard= lazy(() => import('./pages/VendorDashboard.jsx'));
const VendorProducts = lazy(() => import('./pages/VendorProducts.jsx'));
const VendorAddProduct = lazy(() => import('./pages/VendorAddProduct.jsx'));
const VendorOrders   = lazy(() => import('./pages/VendorOrders.jsx'));
const VendorAnalytics = lazy(() => import('./pages/VendorAnalytics.jsx'));
const VendorProfile  = lazy(() => import('./pages/VendorProfile.jsx'));
const VendorSettings = lazy(() => import('./pages/VendorSettings.jsx'));
const Analytics      = lazy(() => import('./pages/Analytics.jsx'));
const Profile        = lazy(() => import('./pages/Profile.jsx'));
const Login          = lazy(() => import('./pages/Login.jsx'));
const Register       = lazy(() => import('./pages/Register.jsx'));
const Forbidden      = lazy(() => import('./pages/Forbidden.jsx'));
const NotFound       = lazy(() => import('./pages/NotFound.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Skeleton variant="page" />
  </div>
);

export default function App() {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);
  const userRole        = useSelector(selectUserRole);

  // ── Auth Restoration on Startup ───────────────────────────────────────────
  // On every app mount, if an accessToken exists in localStorage, attempt to
  // fetch the current user from the server. This restores the Redux user state
  // after a page refresh without forcing a re-login.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      // No token — mark as initialized immediately so routes don't hang
      // authInitialized stays false until this runs, so we dispatch a no-op
      // by importing the action directly. Instead, we handle this in authSlice
      // via the fetchCurrentUser.rejected handler which checks for missing token.
      dispatch(fetchCurrentUser());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive the smart redirect target for authenticated users hitting /login or /register
  const authenticatedRedirect = () => {
    if (!isAuthenticated) return null;
    if (userRole === 'ADMIN')  return '/admin/dashboard';
    if (userRole === 'VENDOR') return '/vendor/dashboard';
    return '/';
  };

  const authRedirect = authenticatedRedirect();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={authRedirect ? <Navigate to={authRedirect} replace /> : <Login />}
          />
          <Route
            path="/register"
            element={authRedirect ? <Navigate to={authRedirect} replace /> : <Register />}
          />
        </Route>

        {/* Main app routes - User Layout */}
        <Route element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="/products"            element={<Products />} />
          <Route path="/products/:id"        element={<ProductDetail />} />
          <Route path="/cart"                element={<Cart />} />
          <Route path="/wishlist"            element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout"            element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"              element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id/tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/profile"             element={<ProtectedRoute roles={['USER']}><Profile /></ProtectedRoute>} />
        </Route>

        {/* Admin routes - Admin Layout */}
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vendors"   element={<AdminVendors />} />
            <Route path="products"  element={<AdminProducts />} />
            <Route path="users"     element={<AdminUsers />} />
            <Route path="orders"    element={<AdminOrders />} />
            <Route path="settings"  element={<AdminSettings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile"   element={<AdminProfile />} />
          </Route>
        </Route>

        {/* Vendor routes - Vendor Layout */}
        <Route element={<ProtectedRoute roles={['VENDOR']} />}>
          <Route path="/vendor" element={<VendorLayout />}>
            <Route path="dashboard"  element={<VendorDashboard />} />
            <Route path="products"   element={<VendorProducts />} />
            <Route path="add-product" element={<VendorAddProduct />} />
            <Route path="orders"     element={<VendorOrders />} />
            <Route path="analytics"  element={<VendorAnalytics />} />
            <Route path="profile"    element={<VendorProfile />} />
            <Route path="settings"   element={<VendorSettings />} />
          </Route>
        </Route>

        <Route path="/403" element={<Forbidden />} />
        <Route path="*"    element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
