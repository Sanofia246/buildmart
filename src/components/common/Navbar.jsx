import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Menu, X, Building2, LogOut, LayoutDashboard, ChevronDown, Tag, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const searchRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    api.get('/categories').then(r => setCategories(r.data.data?.slice(0,8)||[])).catch(()=>{});
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); setCatMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { const r = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`); setSearchResults(r.data.data); } catch {}
    }, 300);
    return () => clearTimeout(timer.current);
  }, [searchQuery]);

  useEffect(() => {
    const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/suppliers?search=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); setSearchQuery(''); }
  };

  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'supplier' ? '/vendor' : '/dashboard';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white border-b border-gray-100'}`}>
      <div className="bg-gray-900 text-gray-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>🏗️ Tamil Nadu's #1 Construction Material Supplier Platform</span>
          <div className="flex gap-4 items-center">
            <Link to="/pricing" className="hover:text-brand-300 font-medium transition-colors">💎 Pricing Plans</Link>
            <span className="text-gray-600">|</span>
            <a href="tel:+919876543210" className="hover:text-white transition-colors">📞 +91 98765 43210</a>
          </div>
        </div>
      </div>
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-brand-600 rounded-lg p-1.5"><Building2 className="w-5 h-5 text-white" /></div>
          <div>
            <span className="font-display text-2xl font-extrabold text-gray-900 tracking-wide leading-none">BUILD<span className="text-brand-600">MART</span></span>
            <div className="text-[9px] text-gray-400 leading-none tracking-widest uppercase">Tamil Nadu</div>
          </div>
        </Link>
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)} placeholder="Search suppliers, materials, cities..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-gray-50" />
            </div>
          </form>
          {searchOpen && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {searchResults.suppliers?.length > 0 && (<div><div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Suppliers</div>
                {searchResults.suppliers.map(s=><Link key={s.id} to={`/suppliers/${s.slug}`} onClick={()=>{setSearchOpen(false);setSearchQuery('');}} className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors"><div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">{s.business_name.charAt(0)}</div><div><div className="text-sm font-medium text-gray-900">{s.business_name}</div><div className="text-xs text-gray-500">{s.city}</div></div></Link>)}
              </div>)}
              {searchResults.categories?.length > 0 && (<div><div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Categories</div>
                {searchResults.categories.map(c=><Link key={c.id} to={`/category/${c.slug}`} onClick={()=>{setSearchOpen(false);setSearchQuery('');}} className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors"><span className="text-xl">{c.icon}</span><span className="text-sm font-medium text-gray-900">{c.name}</span></Link>)}
              </div>)}
              {!searchResults.suppliers?.length && !searchResults.categories?.length && <div className="px-4 py-6 text-center text-gray-400 text-sm">No results found</div>}
            </div>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-1">
          <Link to="/suppliers" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">Suppliers</Link>
          <div className="relative">
            <button onClick={()=>setCatMenuOpen(!catMenuOpen)} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Categories <ChevronDown className={`w-4 h-4 transition-transform ${catMenuOpen?'rotate-180':''}`} />
            </button>
            {catMenuOpen && <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-2">
              {categories.map(c=><Link key={c.id} to={`/category/${c.slug}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-50 text-sm text-gray-700 hover:text-brand-700"><span className="text-lg">{c.icon}</span>{c.name}</Link>)}
            </div>}
          </div>
          <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {user ? (
            <div className="relative">
              <button onClick={()=>setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{user.name?.charAt(0)?.toUpperCase()}</div>
                <span className="text-sm font-medium text-gray-800 hidden sm:block max-w-[90px] truncate">{user.name}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen?'rotate-180':''}`} />
              </button>
              {userMenuOpen && <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-semibold text-sm text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role==='admin'?'👑 Admin':user.role==='supplier'?'🏭 Vendor':'🛍️ Buyer'}</div>
                </div>
                <Link to={dashLink} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><LayoutDashboard className="w-4 h-4"/>{user.role==='admin'?'Admin Panel':user.role==='supplier'?'Vendor Dashboard':'Dashboard'}</Link>
                {user.role==='supplier'&&<Link to="/vendor/plan" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Tag className="w-4 h-4"/>My Plan</Link>}
                {user.role==='admin'&&<Link to="/admin/suppliers" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><ShieldCheck className="w-4 h-4"/>Manage Suppliers</Link>}
                <div className="border-t border-gray-100 mt-1">
                  <button onClick={()=>{logout();navigate('/');}} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/>Logout</button>
                </div>
              </div>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-gray-50 hidden sm:block">Buyer Login</Link>
              <Link to="/vendor-signup" className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Vendor Signup</Link>
              <Link to="/pricing" className="btn-primary text-sm py-2 px-4 hidden sm:block">Post Requirement</Link>
            </div>
          )}
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">{mobileOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}</button>
        </div>
      </nav>
      {mobileOpen && <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
        <Link to="/suppliers" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">All Suppliers</Link>
        <Link to="/pricing" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Pricing</Link>
        {!user?<>
          <Link to="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Buyer Login</Link>
          <Link to="/vendor-signup" className="block text-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">Vendor Signup</Link>
          <Link to="/pricing" className="btn-primary block text-center text-sm">Post Requirement</Link>
        </>:<>
          <Link to={dashLink} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
          <button onClick={()=>{logout();navigate('/');setMobileOpen(false);}} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Logout</button>
        </>}
      </div>}
    </header>
  );
}
