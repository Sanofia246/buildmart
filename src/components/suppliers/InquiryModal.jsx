import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function InquiryModal({ supplier, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    buyer_name: user?.name || '',
    buyer_email: user?.email || '',
    buyer_phone: user?.phone || '',
    buyer_company: '',
    message: '',
    quantity: '',
    unit: 'tons',
    requirement_type: 'one-time',
    product_id: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inquiries', { ...form, supplier_id: supplier.id });
      toast.success('Inquiry sent successfully! The supplier will contact you soon.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide">Send Inquiry</h2>
            <p className="text-xs text-gray-500 mt-0.5">to {supplier.business_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Name *</label>
              <input name="buyer_name" value={form.buyer_name} onChange={handleChange} required className="input-field text-sm py-2.5" placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Company</label>
              <input name="buyer_company" value={form.buyer_company} onChange={handleChange} className="input-field text-sm py-2.5" placeholder="Company (optional)" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label>
              <input name="buyer_phone" value={form.buyer_phone} onChange={handleChange} required className="input-field text-sm py-2.5" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
              <input name="buyer_email" type="email" value={form.buyer_email} onChange={handleChange} required className="input-field text-sm py-2.5" placeholder="you@example.com" />
            </div>
          </div>

          {supplier.products?.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Product of Interest</label>
              <select name="product_id" value={form.product_id} onChange={handleChange} className="input-field text-sm py-2.5">
                <option value="">General Inquiry</option>
                {supplier.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Quantity Needed</label>
              <input name="quantity" value={form.quantity} onChange={handleChange} className="input-field text-sm py-2.5" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="input-field text-sm py-2.5">
                {['tons', 'bags', 'kg', 'pieces', 'sq.ft', 'sq.m', 'cubic meters', 'liters'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Requirement Type</label>
            <div className="flex gap-2">
              {['one-time', 'recurring', 'bulk'].map(t => (
                <label key={t} className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${form.requirement_type === t ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                  <input type="radio" name="requirement_type" value={t} checked={form.requirement_type === t} onChange={handleChange} className="hidden" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Message *</label>
            <textarea name="message" value={form.message} onChange={handleChange} required rows={4}
              className="input-field text-sm py-2.5 resize-none"
              placeholder="Describe your requirement in detail — material grade, delivery location, timeline..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Sending...' : 'Send Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
