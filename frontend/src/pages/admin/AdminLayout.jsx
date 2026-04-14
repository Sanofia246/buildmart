import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Star, MessageSquare, ShoppingCart, CreditCard, Tag, LogOut, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/suppliers', label: 'Suppliers', icon: Building2 },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/plans', label: 'Pricing Plans', icon: CreditCard },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="bg-brand-600 rounded-lg p-1.5"><Building2 className="w-4 h-4 text-white" /></div>
            <span className="font-display text-xl font-extrabold tracking-wide text-white">BUILD<span className="text-brand-400">MART</span></span>
            <span className="ml-auto text-xs bg-brand-600/20 text-brand-400 border border-brand-600/30 px-2 py-0.5 rounded font-semibold">ADMIN</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
            <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/>Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon, exact }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(path, exact) ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {isActive(path, exact) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800">
            <ExternalLink className="w-4 h-4" /> View Public Site
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-slate-900 z-30 px-4 py-3 flex items-center gap-3 border-b border-slate-800">
        <span className="font-display font-extrabold text-white text-lg tracking-wide">BUILD<span className="text-brand-400">MART</span> <span className="text-xs text-brand-400 font-semibold">ADMIN</span></span>
        <div className="ml-auto flex gap-1">
          {NAV.slice(0,5).map(({ path, icon: Icon }) => (
            <Link key={path} to={path} className={`p-2 rounded-lg transition-colors ${isActive(path) ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 md:ml-64 bg-slate-950">
        <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
