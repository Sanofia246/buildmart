import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, X, Clock, Phone, Mail, Package, Filter } from 'lucide-react';
import api from '../../utils/api';
import { Spinner, EmptyState } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';

export default function VendorInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/vendor/inquiries')
      .then(r => { setInquiries(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/vendor/inquiries/${id}/status`, { status });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  const STATUS = { pending: 'bg-amber-100 text-amber-700', responded: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };
  const filtered = inquiries.filter(i => !filter || i.status === filter);
  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">Inquiries</h1>
          <p className="text-gray-500 text-sm mt-1">{inquiries.length} total · <span className="text-amber-600 font-semibold">{pendingCount} pending</span></p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-800">You have {pendingCount} pending {pendingCount === 1 ? 'inquiry' : 'inquiries'} waiting for response!</p>
        </div>
      )}

      <div className="flex gap-2">
        {['', 'pending', 'responded', 'closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${filter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s && <span className="ml-1.5 opacity-70">({inquiries.filter(i => i.status === s).length})</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : filtered.length === 0 ? <EmptyState icon="💬" title="No Inquiries" description="Buyer inquiries will appear here." />
        : (
          <div className="space-y-3">
            {filtered.map(inq => (
              <div key={inq.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${inq.status === 'pending' ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{inq.buyer_name}</div>
                        <div className="text-xs text-gray-500">{inq.buyer_company && `${inq.buyer_company} · `}{new Date(inq.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {inq.requirement_type && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">{inq.requirement_type}</span>}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS[inq.status]}`}>{inq.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2 pl-13">{inq.message}</p>
                </div>

                {expanded === inq.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-brand-500" /><a href={`tel:${inq.buyer_phone}`} className="text-blue-600 hover:underline font-medium">{inq.buyer_phone}</a></div>
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-brand-500" /><a href={`mailto:${inq.buyer_email}`} className="text-blue-600 hover:underline font-medium">{inq.buyer_email}</a></div>
                      {inq.quantity && <div className="flex items-center gap-2 text-sm"><Package className="w-4 h-4 text-brand-500" /><span>{inq.quantity} {inq.unit}</span></div>}
                    </div>
                    {inq.product_name && <div className="text-sm"><span className="text-gray-500">Product: </span><span className="font-semibold text-brand-700">{inq.product_name}</span></div>}
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Message</div>
                      <p className="text-sm text-gray-800">{inq.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inq.status === 'pending' && <>
                        <button onClick={() => updateStatus(inq.id, 'responded')} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Responded
                        </button>
                        <button onClick={() => updateStatus(inq.id, 'closed')} className="flex items-center gap-1.5 text-xs bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">
                          <X className="w-3.5 h-3.5" /> Close
                        </button>
                      </>}
                      <a href={`tel:${inq.buyer_phone}`} className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-100">
                        <Phone className="w-3.5 h-3.5" /> Call Buyer
                      </a>
                      <a href={`mailto:${inq.buyer_email}?subject=Re: Your inquiry on BuildMart`} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100">
                        <Mail className="w-3.5 h-3.5" /> Send Email
                      </a>
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
