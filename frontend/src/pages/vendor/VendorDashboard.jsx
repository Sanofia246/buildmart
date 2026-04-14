import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MessageSquare, Star, Package, ShoppingCart, TrendingUp, ChevronRight, AlertCircle, Crown } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common/UIComponents';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/vendor/stats'),
      api.get('/vendor/plan'),
      api.get('/vendor/inquiries'),
      api.get('/vendor/orders'),
    ]).then(([s, p, inq, ord]) => {
      setStats(s.data.data);
      setPlan(p.data.data);
      setRecentInquiries(inq.data.data?.slice(0, 5) || []);
      setRecentOrders(ord.data.data?.slice(0, 5) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const planName = plan?.name || 'Free';
  const planExpires = plan?.plan_expires_at ? new Date(plan.plan_expires_at).toLocaleDateString('en-IN') : null;
  const isPaid = plan?.slug !== 'free' && plan?.slug;
  const daysLeft = planExpires ? Math.ceil((new Date(plan?.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">Vendor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</p>
        </div>
        <Link to="/vendor/plan" className="btn-primary text-sm py-2 flex items-center gap-2">
          <Crown className="w-4 h-4" /> {isPaid ? 'Manage Plan' : 'Upgrade Now'}
        </Link>
      </div>

      {/* Plan banner */}
      {!isPaid ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">You're on the Free Plan</div>
            <p className="text-blue-100 text-sm mt-1">Upgrade to get featured listings, more leads, and verified badge</p>
          </div>
          <Link to="/vendor/plan" className="bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap">
            Upgrade →
          </Link>
        </div>
      ) : daysLeft && daysLeft <= 7 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div><span className="font-semibold text-amber-800">Plan expiring soon!</span> <span className="text-amber-700 text-sm">Your {planName} plan expires in {daysLeft} days.</span></div>
          <Link to="/vendor/plan" className="ml-auto btn-primary text-sm py-1.5 whitespace-nowrap">Renew</Link>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-green-800">{planName} Plan active {planExpires ? `· Expires ${planExpires}` : ''}</span>
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Profile Views', value: stats.views_30d || 0, sub: 'Last 30 days', icon: Eye, color: 'text-purple-600 bg-purple-50', link: null },
            { label: 'Total Inquiries', value: stats.inquiries?.total || 0, sub: `${stats.inquiries?.pending || 0} pending`, icon: MessageSquare, color: 'text-blue-600 bg-blue-50', link: '/vendor/inquiries' },
            { label: 'Avg Rating', value: stats.reviews?.average || '0.0', sub: `${stats.reviews?.total || 0} reviews`, icon: Star, color: 'text-amber-500 bg-amber-50', link: null },
            { label: 'Active Products', value: stats.products || 0, sub: 'Listed', icon: Package, color: 'text-green-600 bg-green-50', link: '/vendor/products' },
          ].map(({ label, value, sub, icon: Icon, color, link }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${link ? 'hover:shadow-md cursor-pointer transition-all' : ''}`}
              onClick={() => link && (window.location.href = link)}>
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
              <div className="text-2xl font-display font-extrabold text-gray-900">{value}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent inquiries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-display text-lg font-bold tracking-wide">Recent Inquiries</h3>
            <Link to="/vendor/inquiries" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInquiries.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No inquiries yet</div>
            ) : recentInquiries.map(inq => (
              <div key={inq.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{inq.buyer_name}</div>
                  <div className="text-xs text-gray-500 truncate">{inq.message?.slice(0,60)}...</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${inq.status === 'pending' ? 'bg-amber-100 text-amber-700' : inq.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {inq.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-display text-lg font-bold tracking-wide">Recent Orders</h3>
            <Link to="/vendor/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No orders yet</div>
            ) : recentOrders.map(order => (
              <div key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm text-gray-900">{order.order_number}</div>
                  <div className="text-xs text-gray-500">{order.buyer_name} · ₹{parseFloat(order.total_amount||0).toLocaleString('en-IN')}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>{order.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Add Product', icon: '📦', link: '/vendor/products', color: 'from-green-500 to-green-600' },
          { label: 'Edit Profile', icon: '✏️', link: '/vendor/profile', color: 'from-blue-500 to-blue-600' },
          { label: 'View Inquiries', icon: '💬', link: '/vendor/inquiries', color: 'from-purple-500 to-purple-600' },
          { label: 'Upgrade Plan', icon: '⭐', link: '/vendor/plan', color: 'from-brand-500 to-brand-600' },
        ].map(a => (
          <Link key={a.label} to={a.link} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all text-center group">
            <div className={`w-12 h-12 bg-gradient-to-br ${a.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform`}>{a.icon}</div>
            <div className="text-sm font-semibold text-gray-800">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
