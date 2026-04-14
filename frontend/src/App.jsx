import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPage from './pages/PricingPage';
import { CategoryPage, AboutPage } from './pages/CategoryPage';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorInquiries from './pages/vendor/VendorInquiries';
import VendorPlan from './pages/vendor/VendorPlan';
import RegisterSupplierPage from './pages/RegisterSupplierPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPlans from './pages/admin/AdminPlans';
import AdminCategories from './pages/admin/AdminCategories';
import ProtectedRoute from './components/common/ProtectedRoute';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:slug" element={<SupplierDetailPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vendor-signup" element={<RegisterPage defaultRole="supplier" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/register-supplier" element={<ProtectedRoute><RegisterSupplierPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="categories" element={<AdminCategories />} />
          </Route>
          <Route path="/vendor" element={<ProtectedRoute roles={['supplier','admin']}><VendorLayout /></ProtectedRoute>}>
            <Route index element={<VendorDashboard />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="inquiries" element={<VendorInquiries />} />
            <Route path="plan" element={<VendorPlan />} />
          </Route>
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '10px' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
