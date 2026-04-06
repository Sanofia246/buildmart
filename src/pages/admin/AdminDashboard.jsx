import { useState, useEffect } from 'react';
import { Users, Building2, MessageSquare, Star, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats, recentSuppliers, recentInquiries } = data || {};

  const cards = [
    { label: 'Total Users', value: stats?.users?.total || 0, sub: `+${stats?.users?.new_week || 0} this week`, icon: Users, color: 'text-blue-400 bg-blue-400/10' },
    { label: 'Active Suppliers', value: stats?.suppliers?.total || 0, sub: `${stats?.suppliers?.verified || 0} verified`, icon: Building2, color: 'text-green-400 bg-green-400/10' },
    { label: 'Total Inquiries', value: stats?.inquiries?.total || 0, sub: `${stats?.inquiries?.pending || 0} pending`, icon: MessageSquare, color: 'text-purple-400 bg-purple-400/10' },
    { label: 'Avg Rating', value: stats?.reviews?.avg_rating || '0.0', sub: `${stats?.reviews?.total || 0} reviews`, icon: Star, color: 'text-amber-400 bg-amber-400/10' },
    { label: 'Premium Suppliers', value: stats?.suppliers?.premium || 0, sub: 'Paying customers', icon: TrendingUp, color: 'text-brand-400 bg-brand-400/10' },
    { label: 'Revenue (Active Subs)', value: `₹${parseFloat(stats?.revenue || 0).toLocaleString('en-IN')}`, sub: 'Subscription revenue', icon: DollarSign, color: 'text-emerald-400 bg-emerald-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-display font-extrabold text-white">{value}</div>
            <div className="text-sm font-medium text-slate-300">{label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent suppliers */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white tracking-wide">Recent Suppliers</h3>
            <a href="/admin/suppliers" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">View all →</a>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentSuppliers?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No suppliers yet</div>
            ) : recentSuppliers?.map(s => (
              <div key={s.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                  {s.business_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{s.business_name}</div>
                  <div className="text-xs text-slate-400">{s.city} · {s.plan_name || 'Free'}</div>
                </div>
                {s.is_verified
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-semibold"><CheckCircle className="w-3 h-3"/>Verified</span>
                  : <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-semibold"><Clock className="w-3 h-3"/>Pending</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Recent inquiries */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white tracking-wide">Recent Inquiries</h3>
            <a href="/admin/inquiries" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">View all →</a>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentInquiries?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No inquiries yet</div>
            ) : recentInquiries?.map(i => (
              <div key={i.id} className="px-5 py-3.5 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{i.buyer_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${i.status==='pending'?'bg-amber-400/10 text-amber-400':i.status==='responded'?'bg-green-400/10 text-green-400':'bg-slate-700 text-slate-400'}`}>{i.status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{i.business_name} · {i.message?.slice(0,60)}...</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Verify Suppliers', link: '/admin/suppliers', icon: '✅', desc: 'Review pending' },
          { label: 'Manage Users', link: '/admin/users', icon: '👥', desc: 'View all users' },
          { label: 'Pricing Plans', link: '/admin/plans', icon: '💎', desc: 'Edit plan pricing' },
          { label: 'Categories', link: '/admin/categories', icon: '🗂️', desc: 'Add / edit' },
        ].map(a => (
          <a key={a.label} href={a.link} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 hover:bg-slate-800 transition-all text-center group">
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="text-sm font-bold text-white">{a.label}</div>
            <div className="text-xs text-slate-500">{a.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
