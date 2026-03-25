import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Package, MessageSquare, Heart, Star, Settings, ChevronRight, TrendingUp, Eye, CheckCircle, Clock, AlertCircle, Plus, Loader2, Trash2, Edit } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StarRating, Spinner, EmptyState } from '../components/common/UIComponents';
import SupplierCard from '../components/common/SupplierCard';
import toast from 'react-hot-toast';

const NAV = [
  { path: '', label: 'Overview', icon: LayoutDashboard },
  { path: 'supplier', label: 'My Business', icon: Building2 },
  { path: 'products', label: 'Products', icon: Package },
  { path: 'inquiries', label: 'Inquiries', icon: MessageSquare },
  { path: 'saved', label: 'Saved', icon: Heart },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/dashboard/')[1] || '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="card p-4 sticky top-24">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
            </div>
            <nav className="space-y-1">
              {NAV.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={`/dashboard/${path}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === path ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide md:hidden">
            {NAV.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={`/dashboard/${path}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeTab === path ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </div>

          <Routes>
            <Route index element={<DashOverview />} />
            <Route path="supplier" element={<MySupplierProfile />} />
            <Route path="products" element={<MyProducts />} />
            <Route path="inquiries" element={<MyInquiries />} />
            <Route path="saved" element={<SavedSuppliers />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────
function DashOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'supplier' || user?.supplier_id) {
      api.get('/suppliers/me/stats').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [user]);

  return (
    <div>
      <h1 className="section-title mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome back, {user?.name?.split(' ')[0]}! 👋</p>

      {(user?.role === 'supplier' || user?.supplier_id) && (
        loading ? <div className="flex justify-center py-10"><Spinner /></div> : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Inquiries', value: stats.inquiries?.total || 0, sub: `${stats.inquiries?.pending || 0} pending`, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
              { label: 'Profile Views', value: stats.views_30d || 0, sub: 'Last 30 days', icon: Eye, color: 'text-purple-600 bg-purple-50' },
              { label: 'Average Rating', value: stats.reviews?.average || '0.0', sub: `${stats.reviews?.total || 0} reviews`, icon: Star, color: 'text-amber-600 bg-amber-50' },
              { label: 'Active Products', value: stats.products || 0, sub: 'Listed products', icon: Package, color: 'text-green-600 bg-green-50' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-display font-extrabold text-gray-900">{value}</div>
                <div className="text-sm font-medium text-gray-700">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        ) : null
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Complete Your Profile', desc: 'Add photos, products & certifications to attract more buyers', link: '/dashboard/supplier', icon: '📋', color: 'from-blue-500 to-blue-600' },
          { title: 'Add Your Products', desc: 'List the materials you supply with prices and specifications', link: '/dashboard/products', icon: '📦', color: 'from-brand-500 to-brand-600' },
          { title: 'View Inquiries', desc: 'Check and respond to buyer inquiries quickly', link: '/dashboard/inquiries', icon: '💬', color: 'from-green-500 to-green-600' },
          { title: 'Saved Suppliers', desc: 'View suppliers you have saved for reference', link: '/dashboard/saved', icon: '❤️', color: 'from-red-500 to-red-600' },
        ].map(card => (
          <Link key={card.title} to={card.link}
            className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>
              {card.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-0.5">{card.title}</div>
              <div className="text-xs text-gray-500">{card.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── SUPPLIER PROFILE ───────────────────────────────────────
function MySupplierProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/suppliers/me').then(r => { setProfile(r.data.data); setForm(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/suppliers/me', form);
      setProfile(form);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (!profile) return (
    <EmptyState icon="🏭" title="No Business Profile"
      description="You haven't registered your business yet."
      action={<Link to="/register-supplier" className="btn-primary">Register Your Business</Link>} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">My Business</h2>
        <div className="flex gap-3">
          {profile.slug && <Link to={`/suppliers/${profile.slug}`} target="_blank" className="btn-secondary text-sm py-2">View Public Page</Link>}
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Save Changes' : <><Edit className="w-4 h-4" /> Edit</>}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        {profile.is_verified ? (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold p-3 rounded-xl border border-green-100">
            <CheckCircle className="w-4 h-4" /> Your business is verified ✓
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-semibold p-3 rounded-xl border border-amber-100">
            <Clock className="w-4 h-4" /> Verification pending (24-48 hours)
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Business Name</label>
              <input value={form.business_name || ''} onChange={e => setForm(p => ({...p, business_name: e.target.value}))} className="input-field" /></div>
            <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={4} className="input-field resize-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-semibold text-gray-600 mb-1 block">City</label>
                <input value={form.city || ''} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="input-field" /></div>
              <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Pincode</label>
                <input value={form.pincode || ''} onChange={e => setForm(p => ({...p, pincode: e.target.value}))} className="input-field" /></div>
            </div>
            <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Website</label>
              <input value={form.website_url || ''} onChange={e => setForm(p => ({...p, website_url: e.target.value}))} className="input-field" placeholder="https://" /></div>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div><div className="text-xs font-semibold text-gray-500 mb-1">Business Name</div><div className="font-semibold text-gray-900">{profile.business_name}</div></div>
            {profile.description && <div><div className="text-xs font-semibold text-gray-500 mb-1">Description</div><div className="text-gray-700 text-sm leading-relaxed">{profile.description}</div></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs font-semibold text-gray-500 mb-1">City</div><div className="font-medium text-gray-900">{profile.city || '—'}</div></div>
              <div><div className="text-xs font-semibold text-gray-500 mb-1">District</div><div className="font-medium text-gray-900">{profile.district || '—'}</div></div>
              {profile.gst_number && <div><div className="text-xs font-semibold text-gray-500 mb-1">GST</div><div className="font-mono font-medium text-gray-900">{profile.gst_number}</div></div>}
              {profile.established_year && <div><div className="text-xs font-semibold text-gray-500 mb-1">Established</div><div className="font-medium text-gray-900">{profile.established_year}</div></div>}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-display font-extrabold text-brand-600">{parseFloat(profile.average_rating || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-display font-extrabold text-brand-600">{profile.total_reviews || 0}</div>
                <div className="text-xs text-gray-500">Reviews</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-display font-extrabold text-brand-600">{profile.response_rate || 0}%</div>
                <div className="text-xs text-gray-500">Response</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PRODUCTS ───────────────────────────────────────────────
function MyProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category_id: '', price_min: '', price_max: '', price_unit: 'ton', min_order_quantity: '', min_order_unit: 'ton' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/products/me'), api.get('/categories')])
      .then(([p, c]) => { setProducts(p.data.data || []); setCategories(c.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/products', form);
      setProducts(prev => [res.data.data, ...prev]);
      setAddOpen(false);
      setForm({ name: '', description: '', category_id: '', price_min: '', price_max: '', price_unit: 'ton', min_order_quantity: '', min_order_unit: 'ton' });
      toast.success('Product added!');
    } catch { toast.error('Failed to add product'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); setProducts(prev => prev.filter(p => p.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">My Products</h2>
        <button onClick={() => setAddOpen(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {addOpen && (
        <div className="card p-5 mb-6 border-2 border-brand-200">
          <h3 className="font-display text-lg font-bold tracking-wide mb-4">Add New Product</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required className="input-field text-sm py-2.5" placeholder="e.g. TMT Steel Bar Fe500" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                <select value={form.category_id} onChange={e => setForm(p => ({...p, category_id: e.target.value}))} className="input-field text-sm py-2.5">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2} className="input-field text-sm py-2.5 resize-none" placeholder="Grade, specifications..." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Min Price (₹)</label>
                <input type="number" value={form.price_min} onChange={e => setForm(p => ({...p, price_min: e.target.value}))} className="input-field text-sm py-2.5" placeholder="0" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Max Price (₹)</label>
                <input type="number" value={form.price_max} onChange={e => setForm(p => ({...p, price_max: e.target.value}))} className="input-field text-sm py-2.5" placeholder="0" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Per Unit</label>
                <select value={form.price_unit} onChange={e => setForm(p => ({...p, price_unit: e.target.value}))} className="input-field text-sm py-2.5">
                  {['ton', 'bag', 'kg', 'piece', 'sq.ft', 'sq.m', 'cubic meter', 'liter', 'bundle'].map(u => <option key={u} value={u}>{u}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
              </button>
              <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary text-sm py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : products.length === 0 ? <EmptyState icon="📦" title="No Products Yet" description="Add your construction materials to attract more buyers." action={<button onClick={() => setAddOpen(true)} className="btn-primary">Add First Product</button>} />
        : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.category_name} {product.price_min ? `• ₹${product.price_min}${product.price_max ? `-${product.price_max}` : ''}/${product.price_unit}` : ''}</div>
                </div>
                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ── INQUIRIES ──────────────────────────────────────────────
function MyInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inquiries/me').then(r => { setInquiries(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try { await api.put(`/inquiries/${id}/status`, { status }); setInquiries(prev => prev.map(i => i.id === id ? {...i, status} : i)); toast.success('Status updated'); }
    catch { toast.error('Failed'); }
  };

  const statusColors = { pending: 'bg-amber-100 text-amber-700', responded: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };

  return (
    <div>
      <h2 className="section-title mb-6">Inquiries</h2>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : inquiries.length === 0 ? <EmptyState icon="💬" title="No Inquiries Yet" description="When buyers contact you, their inquiries will appear here." />
        : (
          <div className="space-y-4">
            {inquiries.map(inq => (
              <div key={inq.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{inq.buyer_name}</div>
                    <div className="text-xs text-gray-500">{inq.buyer_company && `${inq.buyer_company} • `}{inq.buyer_phone} • {inq.buyer_email}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusColors[inq.status]}`}>{inq.status}</span>
                </div>
                {inq.product_name && <div className="text-xs text-brand-600 font-medium mb-2">Product: {inq.product_name}</div>}
                <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg">{inq.message}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">{new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} {inq.quantity && `• Qty: ${inq.quantity} ${inq.unit}`}</div>
                  {inq.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(inq.id, 'responded')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700">Mark Responded</button>
                      <button onClick={() => updateStatus(inq.id, 'closed')} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-300">Close</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ── SAVED ──────────────────────────────────────────────────
function SavedSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/saved').then(r => { setSuppliers(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleUnsave = async (id) => {
    try { await api.delete(`/saved/${id}`); setSuppliers(prev => prev.filter(s => s.id !== id)); toast.success('Removed'); }
    catch {}
  };

  return (
    <div>
      <h2 className="section-title mb-6">Saved Suppliers</h2>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : suppliers.length === 0 ? <EmptyState icon="❤️" title="No Saved Suppliers" description="Save suppliers to quickly find them later." action={<Link to="/suppliers" className="btn-primary">Browse Suppliers</Link>} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map(s => <SupplierCard key={s.id} supplier={s} onSave={() => handleUnsave(s.id)} saved={true} />)}
          </div>
        )}
    </div>
  );
}
