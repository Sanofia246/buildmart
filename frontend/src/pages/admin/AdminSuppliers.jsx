import { useState, useEffect } from 'react';
import { Search, CheckCircle, X, Crown, Eye, EyeOff, Tag, Filter, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = { free: 'bg-slate-700 text-slate-300', pro: 'bg-blue-500/20 text-blue-300', enterprise: 'bg-brand-500/20 text-brand-300' };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [planModal, setPlanModal] = useState(null); // supplier
  const [planForm, setPlanForm] = useState({ plan_slug: 'free', months: 1 });

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search, plan: filterPlan };
      if (filterVerified) params.verified = filterVerified;
      const res = await api.get('/admin/suppliers', { params });
      setSuppliers(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, filterVerified, filterPlan]);

  const handleVerify = async (id) => {
    try {
      const res = await api.patch(`/admin/suppliers/${id}/verify`);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, is_verified: res.data.data.is_verified } : s));
      toast.success(res.data.message);
    } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await api.patch(`/admin/suppliers/${id}/active`);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, is_active: res.data.data.is_active } : s));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleAssignPlan = async () => {
    try {
      await api.post(`/admin/suppliers/${planModal.id}/plan`, planForm);
      setSuppliers(prev => prev.map(s => s.id === planModal.id ? { ...s, plan_slug: planForm.plan_slug, plan_name: planForm.plan_slug.charAt(0).toUpperCase() + planForm.plan_slug.slice(1) } : s));
      toast.success(`Plan assigned to ${planModal.business_name}`);
      setPlanModal(null);
    } catch { toast.error('Failed'); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetch(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Suppliers</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total || 0} total suppliers</p>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 px-3 py-2 rounded-lg hover:border-slate-500 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500" />
        </form>
        <select value={filterVerified} onChange={e=>{setFilterVerified(e.target.value);setPage(1);}}
          className="bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500">
          <option value="">All Status</option>
          <option value="true">✅ Verified</option>
          <option value="false">⏳ Pending</option>
        </select>
        <select value={filterPlan} onChange={e=>{setFilterPlan(e.target.value);setPage(1);}}
          className="bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                {['Business', 'Owner', 'Location', 'Plan', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-500">Loading...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-500">No suppliers found</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">{s.business_name?.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.business_name}</div>
                        <div className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-300">{s.owner_name}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{[s.city, s.district].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[s.plan_slug] || PLAN_COLORS.free}`}>
                      {s.plan_name || 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-amber-400 font-semibold">
                    ⭐ {parseFloat(s.average_rating || 0).toFixed(1)} <span className="text-slate-500 font-normal">({s.total_reviews})</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_verified
                      ? <span className="flex items-center gap-1 text-xs text-green-400 font-semibold"><CheckCircle className="w-3 h-3"/>Verified</span>
                      : <span className="text-xs text-amber-400 font-semibold">⏳ Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleVerify(s.id)} title={s.is_verified ? 'Unverify' : 'Verify'}
                        className={`p-1.5 rounded-lg transition-colors ${s.is_verified ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-400 hover:bg-green-400/10 hover:text-green-400'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPlanModal(s)} title="Assign Plan"
                        className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-400/10 transition-colors">
                        <Crown className="w-4 h-4" />
                      </button>
                      <a href={`/suppliers/${s.slug}`} target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 px-4 py-4 border-t border-slate-700">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 10).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Plan assignment modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPlanModal(null)} />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">Assign Plan</h3>
            <p className="text-slate-400 text-sm mb-5">Assigning plan to: <span className="text-white font-semibold">{planModal.business_name}</span></p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Plan</label>
                <select value={planForm.plan_slug} onChange={e => setPlanForm(p => ({...p, plan_slug: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-brand-500">
                  <option value="free">Free</option>
                  <option value="pro">Pro — ₹999/month</option>
                  <option value="enterprise">Enterprise — ₹2999/month</option>
                </select>
              </div>
              {planForm.plan_slug !== 'free' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Duration (months)</label>
                  <input type="number" min={1} max={24} value={planForm.months} onChange={e => setPlanForm(p => ({...p, months: parseInt(e.target.value)}))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-brand-500" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleAssignPlan} className="btn-primary flex-1">Assign Plan</button>
              <button onClick={() => setPlanModal(null)} className="flex-1 bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
