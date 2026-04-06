// AdminUsers.jsx
import { useState, useEffect } from 'react';
import { Search, CheckCircle, X, UserCheck, UserX } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 20, search, role: roleFilter } });
      setUsers(res.data.data || []); setPagination(res.data.pagination || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, roleFilter]);

  const toggle = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.data.is_active } : u));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const ROLE_COLORS = { admin: 'bg-brand-500/20 text-brand-300', supplier: 'bg-blue-500/20 text-blue-300', buyer: 'bg-slate-700 text-slate-300' };

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Users</h1><p className="text-slate-400 text-sm mt-1">{pagination.total || 0} total users</p></div>
      <div className="flex gap-3">
        <form onSubmit={e=>{e.preventDefault();fetch();}} className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..." className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500" />
        </form>
        <select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1);}} className="bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500">
          <option value="">All Roles</option><option value="buyer">Buyer</option><option value="supplier">Supplier</option><option value="admin">Admin</option>
        </select>
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700 bg-slate-800/80">{['Name','Email','Phone','Role','Status','Joined','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? <tr><td colSpan={7} className="py-16 text-center text-slate-500">Loading...</td></tr>
                : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">{u.name?.charAt(0)}</div><div className="text-sm font-semibold text-white">{u.name}</div></div></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{u.phone}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>{u.is_active ? '● Active' : '● Inactive'}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>toggle(u.id)} className={`p-1.5 rounded-lg transition-colors ${u.is_active?'text-red-400 hover:bg-red-400/10':'text-green-400 hover:bg-green-400/10'}`} title={u.is_active?'Deactivate':'Activate'}>
                      {u.is_active ? <UserX className="w-4 h-4"/> : <UserCheck className="w-4 h-4"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && <div className="flex justify-center gap-2 px-4 py-4 border-t border-slate-700">
          {Array.from({length:pagination.pages},(_, i)=>i+1).slice(0,10).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold ${page===p?'bg-brand-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>{p}</button>)}
        </div>}
      </div>
    </div>
  );
}

export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reviews').then(r=>{setReviews(r.data.data||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try { await api.delete(`/admin/reviews/${id}`); setReviews(prev=>prev.filter(r=>r.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Reviews</h1><p className="text-slate-400 text-sm mt-1">{reviews.length} total reviews</p></div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700 bg-slate-800/80">{['Reviewer','Supplier','Rating','Comment','Date','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? <tr><td colSpan={6} className="py-16 text-center text-slate-500">Loading...</td></tr>
                : reviews.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-sm text-white font-medium">{r.reviewer_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{r.business_name}</td>
                  <td className="px-4 py-3"><div className="flex gap-0.5">{[1,2,3,4,5].map(s=><span key={s} className={s<=r.rating?'text-amber-400':'text-slate-600'}>★</span>)}</div></td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-xs"><div className="truncate">{r.comment}</div></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3"><button onClick={()=>deleteReview(r.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><X className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/admin/inquiries', { params: { status, limit: 30 } }).then(r=>{setInquiries(r.data.data||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, [status]);

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Inquiries</h1><p className="text-slate-400 text-sm mt-1">{inquiries.length} inquiries</p></div>
      <div className="flex gap-2">
        {['','pending','responded','closed'].map(s=><button key={s} onClick={()=>setStatus(s)} className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${status===s?'bg-brand-600 border-brand-600 text-white':'border-slate-700 text-slate-400 hover:border-slate-500'}`}>{s||'All'}</button>)}
      </div>
      <div className="space-y-3">
        {loading ? <div className="text-center py-16 text-slate-500">Loading...</div>
          : inquiries.map(i => (
          <div key={i.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div><div className="font-semibold text-white text-sm">{i.buyer_name} <span className="text-slate-400 font-normal">→</span> <span className="text-brand-400">{i.business_name}</span></div>
                <div className="text-xs text-slate-500">{i.buyer_phone} · {i.buyer_email}</div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${i.status==='pending'?'bg-amber-400/10 text-amber-400':i.status==='responded'?'bg-green-400/10 text-green-400':'bg-slate-700 text-slate-400'}`}>{i.status}</span>
            </div>
            <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg">{i.message}</p>
            <div className="text-xs text-slate-500 mt-2">{new Date(i.created_at).toLocaleDateString('en-IN')} {i.quantity && `· Qty: ${i.quantity} ${i.unit}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders').then(r=>{setOrders(r.data.data||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const STATUS_COLORS = { pending:'bg-amber-400/10 text-amber-400', confirmed:'bg-blue-400/10 text-blue-400', processing:'bg-purple-400/10 text-purple-400', shipped:'bg-indigo-400/10 text-indigo-400', delivered:'bg-green-400/10 text-green-400', cancelled:'bg-red-400/10 text-red-400' };

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Orders</h1><p className="text-slate-400 text-sm mt-1">{orders.length} total orders</p></div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700 bg-slate-800/80">{['Order #','Supplier','Buyer','Amount','Status','Date'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? <tr><td colSpan={6} className="py-16 text-center text-slate-500">Loading...</td></tr>
                : orders.length===0 ? <tr><td colSpan={6} className="py-16 text-center text-slate-500">No orders yet</td></tr>
                : orders.map(o=>(
                <tr key={o.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-mono text-xs text-brand-400">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{o.business_name}</td>
                  <td className="px-4 py-3"><div className="text-sm text-white">{o.buyer_name}</div><div className="text-xs text-slate-500">{o.buyer_phone}</div></td>
                  <td className="px-4 py-3 text-sm font-bold text-white">₹{parseFloat(o.total_amount||0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]||'bg-slate-700 text-slate-400'}`}>{o.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/plans').then(r=>{setPlans(r.data.data||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const startEdit = (plan) => { setEditing(plan.id); setForm({ price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, max_products: plan.max_products, max_images_per_product: plan.max_images_per_product, featured_listing: plan.featured_listing, analytics_dashboard: plan.analytics_dashboard, unlimited_leads: plan.unlimited_leads, verified_badge: plan.verified_badge }); };

  const handleSave = async () => {
    setSaving(true);
    try { await api.put(`/admin/plans/${editing}`, form); const res = await api.get('/admin/plans'); setPlans(res.data.data||[]); setEditing(null); toast.success('Plan updated!'); }
    catch { toast.error('Failed'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Pricing Plans</h1><p className="text-slate-400 text-sm mt-1">Manage subscription plan features and pricing</p></div>
      {loading ? <div className="text-center py-16 text-slate-500">Loading...</div>
        : plans.map(plan => (
        <div key={plan.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-display text-xl font-extrabold text-white tracking-wide">{plan.name}</h3><div className="text-slate-400 text-sm">{plan.subscriber_count} active subscribers</div></div>
            {editing === plan.id
              ? <div className="flex gap-2"><button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">{saving?'Saving...':'Save'}</button><button onClick={()=>setEditing(null)} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-600">Cancel</button></div>
              : <button onClick={()=>startEdit(plan)} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-600 transition-colors">Edit Plan</button>
            }
          </div>
          {editing === plan.id ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[['price_monthly','Price/Month (₹)','number'],['price_yearly','Price/Year (₹)','number'],['max_products','Max Products','number'],['max_images_per_product','Images/Product','number']].map(([k,l,t])=>(
                <div key={k}><label className="text-xs font-semibold text-slate-400 mb-1 block">{l}</label><input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:t==='number'?parseInt(e.target.value):e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" /></div>
              ))}
              {[['featured_listing','Featured Listing'],['analytics_dashboard','Analytics Dashboard'],['unlimited_leads','Unlimited Leads'],['verified_badge','Verified Badge']].map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.checked}))} className="rounded text-brand-500" /><span className="text-sm text-slate-300">{l}</span></label>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[['Monthly Price',`₹${plan.price_monthly.toLocaleString('en-IN')}`],['Yearly Price',`₹${plan.price_yearly.toLocaleString('en-IN')}`],['Max Products',plan.max_products>=999999?'Unlimited':plan.max_products],['Images/Product',plan.max_images_per_product]].map(([l,v])=>(
                <div key={l} className="text-center p-3 bg-slate-900/50 rounded-xl"><div className="text-lg font-display font-extrabold text-white">{v}</div><div className="text-xs text-slate-400 mt-0.5">{l}</div></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r=>{setCategories(r.data.data||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const res = await api.post('/admin/categories', form); setCategories(prev=>[...prev, res.data.data]); setShowAdd(false); setForm({name:'',icon:'',description:''}); toast.success('Category added!'); }
    catch { toast.error('Failed'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Categories</h1><p className="text-slate-400 text-sm mt-1">{categories.length} categories</p></div>
        <button onClick={()=>setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2 text-sm">+ Add Category</button>
      </div>
      {showAdd && (
        <div className="bg-slate-800/50 border-2 border-brand-500/50 rounded-2xl p-5">
          <h3 className="font-display text-lg font-bold text-white tracking-wide mb-4">New Category</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label><input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" placeholder="e.g. Cement & Concrete" /></div>
            <div><label className="text-xs font-semibold text-slate-400 mb-1 block">Icon (emoji)</label><input value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" placeholder="e.g. 🏗️" /></div>
            <div><label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" /></div>
            <div className="col-span-3 flex gap-3"><button type="submit" disabled={saving} className="btn-primary text-sm">{saving?'Adding...':'Add Category'}</button><button type="button" onClick={()=>setShowAdd(false)} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-600">Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="text-center py-16 text-slate-500">Loading...</div>
        : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-colors">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-semibold text-white text-sm">{cat.name}</div>
              <div className="text-xs text-slate-500 mt-1">{cat.supplier_count || 0} suppliers</div>
              {cat.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</div>}
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// Default exports for individual file imports
export default AdminUsers;
