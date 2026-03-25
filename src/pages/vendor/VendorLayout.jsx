import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Package, ShoppingCart, MessageSquare, CreditCard, LogOut, Bell, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/vendor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/vendor/profile', label: 'Business Profile', icon: Building2 },
  { path: '/vendor/products', label: 'Products', icon: Package },
  { path: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/vendor/inquiries', label: 'Inquiries', icon: MessageSquare },
  { path: '/vendor/plan', label: 'My Plan', icon: CreditCard },
];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="bg-brand-600 rounded-lg p-1.5"><Building2 className="w-4 h-4 text-white" /></div>
            <span className="font-display text-xl font-extrabold tracking-wide">BUILD<span className="text-brand-400">MART</span></span>
          </Link>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
            <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">Vendor Account</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon, exact }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(path, exact) ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {isActive(path, exact) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <Link to="/" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            <ExternalLink className="w-4 h-4" /> View Public Site
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-gray-900 z-30 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-brand-600 rounded p-1"><Building2 className="w-4 h-4 text-white" /></div>
          <span className="font-display font-extrabold text-white text-lg tracking-wide">BUILD<span className="text-brand-400">MART</span></span>
        </Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {NAV.slice(0,4).map(({ path, icon: Icon }) => (
            <Link key={path} to={path} className={`p-2 rounded-lg transition-colors ${isActive(path) ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <div className="md:p-8 p-4 pt-20 md:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
