import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, ChevronDown, ChevronUp, Loader2, X, Search } from 'lucide-react';
import api from '../../utils/api';
import { Spinner, EmptyState } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    buyer_name: '', buyer_email: '', buyer_phone: '', buyer_address: '', notes: '', delivery_date: '',
    items: [{ product_id: '', product_name: '', quantity: '', unit: 'ton', unit_price: '' }]
  });

  useEffect(() => {
    Promise.all([api.get('/vendor/orders'), api.get('/vendor/products'), api.get('/vendor/profile')])
      .then(([o, p, pr]) => {
        setOrders(o.data.data || []);
        setProducts(p.data.data || []);
        setProfile(pr.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/vendor/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Update failed'); }
  };

  const addOrderItem = () => setNewOrder(p => ({ ...p, items: [...p.items, { product_id: '', product_name: '', quantity: '', unit: 'ton', unit_price: '' }] }));
  const removeOrderItem = (i) => setNewOrder(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setNewOrder(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [key]: val, ...(key === 'product_id' && val ? { product_name: products.find(pr => pr.id === val)?.name || item.product_name } : {}) } : item) }));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!profile) { toast.error('Supplier profile not found'); return; }
    setSaving(true);
    try {
      const res = await api.post('/vendor/orders', { ...newOrder, supplier_id: profile.id });
      setOrders(prev => [res.data.data, ...prev]);
      setShowNewOrder(false);
      setNewOrder({ buyer_name: '', buyer_email: '', buyer_phone: '', buyer_address: '', notes: '', delivery_date: '', items: [{ product_id: '', product_name: '', quantity: '', unit: 'ton', unit_price: '' }] });
      toast.success('Order created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const filtered = orders.filter(o =>
    (!filter || o.status === filter) &&
    (!search || o.order_number?.includes(search) || o.buyer_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders · ₹{totalRevenue.toLocaleString('en-IN')} revenue</p>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['pending','confirmed','processing','shipped','delivered'].map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)}
              className={`p-3 rounded-xl text-center transition-all border-2 ${filter === s ? 'border-brand-500 bg-brand-50' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
              <div className="text-2xl font-display font-extrabold text-gray-900">{count}</div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${STATUS_COLORS[s]}`}>{s}</div>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number or buyer..." className="input-field pl-10 py-2.5 text-sm" />
        </div>
        {filter && <button onClick={() => setFilter('')} className="btn-secondary text-sm py-2 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear Filter</button>}
      </div>

      {/* New Order Form */}
      {showNewOrder && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl font-bold tracking-wide">Create New Order</h3>
            <button onClick={() => setShowNewOrder(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Buyer Name *</label><input required value={newOrder.buyer_name} onChange={e => setNewOrder(p=>({...p, buyer_name: e.target.value}))} className="input-field text-sm py-2.5" placeholder="Full name" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label><input required value={newOrder.buyer_phone} onChange={e => setNewOrder(p=>({...p, buyer_phone: e.target.value}))} className="input-field text-sm py-2.5" placeholder="+91..." /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label><input type="email" value={newOrder.buyer_email} onChange={e => setNewOrder(p=>({...p, buyer_email: e.target.value}))} className="input-field text-sm py-2.5" placeholder="email@example.com" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Address</label><textarea value={newOrder.buyer_address} onChange={e=>setNewOrder(p=>({...p,buyer_address:e.target.value}))} className="input-field text-sm py-2.5 resize-none" rows={2} placeholder="Delivery address..." /></div>
              <div>
                <div className="mb-3"><label className="text-xs font-semibold text-gray-500 mb-1 block">Expected Delivery</label><input type="date" value={newOrder.delivery_date} onChange={e=>setNewOrder(p=>({...p,delivery_date:e.target.value}))} className="input-field text-sm py-2.5" /></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label><input value={newOrder.notes} onChange={e=>setNewOrder(p=>({...p,notes:e.target.value}))} className="input-field text-sm py-2.5" placeholder="Special instructions..." /></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-500">Order Items *</label>
                <button type="button" onClick={addOrderItem} className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1"><Plus className="w-3 h-3"/>Add Item</button>
              </div>
              <div className="space-y-2">
                {newOrder.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} className="input-field text-sm py-2 flex-1">
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {!item.product_id && <input value={item.product_name} onChange={e=>updateItem(i,'product_name',e.target.value)} placeholder="Or type product name" className="input-field text-sm py-2 flex-1" />}
                    <input type="number" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} placeholder="Qty" className="input-field text-sm py-2 w-20" required />
                    <select value={item.unit} onChange={e=>updateItem(i,'unit',e.target.value)} className="input-field text-sm py-2 w-24">
                      {['ton','bag','kg','piece','sq.ft','cubic meter'].map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" value={item.unit_price} onChange={e=>updateItem(i,'unit_price',e.target.value)} placeholder="₹/unit" className="input-field text-sm py-2 w-28" />
                    {newOrder.items.length > 1 && <button type="button" onClick={()=>removeOrderItem(i)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>}
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-bold text-gray-900 mt-2">
                Total: ₹{newOrder.items.reduce((s,i)=>s+(parseFloat(i.unit_price||0)*parseFloat(i.quantity||0)),0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Order
              </button>
              <button type="button" onClick={()=>setShowNewOrder(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Orders list */}
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : filtered.length === 0 ? <EmptyState icon="🛒" title="No Orders Found" description="Orders from buyers will appear here." action={<button onClick={()=>setShowNewOrder(true)} className="btn-primary">Create First Order</button>} />
        : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={()=>setExpanded(expanded===order.id?null:order.id)}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900">{order.order_number}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.buyer_name} · {order.buyer_phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-bold text-gray-900">₹{parseFloat(order.total_amount||0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    {expanded === order.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {expanded === order.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Buyer Details</div>
                        <div className="text-sm text-gray-900">{order.buyer_name}</div>
                        <div className="text-sm text-gray-600">{order.buyer_phone} · {order.buyer_email}</div>
                        {order.buyer_address && <div className="text-sm text-gray-600 mt-1">{order.buyer_address}</div>}
                      </div>
                      {order.notes && <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Notes</div>
                        <div className="text-sm text-gray-700">{order.notes}</div>
                      </div>}
                    </div>
                    {order.items && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Items</div>
                        <div className="space-y-1.5">
                          {(Array.isArray(order.items) ? order.items : []).filter(i=>i?.product_name).map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-white rounded-lg p-2.5 border border-gray-100">
                              <span className="font-medium text-gray-900">{item.product_name}</span>
                              <span className="text-gray-600">{item.quantity} {item.unit} {item.unit_price ? `· ₹${parseFloat(item.unit_price).toLocaleString('en-IN')}/unit` : ''}</span>
                              <span className="font-bold text-gray-900">₹{parseFloat(item.total_price||0).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <>
                          {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                            <button onClick={() => updateStatus(order.id, STATUS_FLOW[STATUS_FLOW.indexOf(order.status)+1])}
                              className="text-xs bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-700 transition-colors">
                              Mark as {STATUS_FLOW[STATUS_FLOW.indexOf(order.status)+1]}
                            </button>
                          )}
                          <button onClick={() => updateStatus(order.id, 'cancelled')}
                            className="text-xs bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                            Cancel Order
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
