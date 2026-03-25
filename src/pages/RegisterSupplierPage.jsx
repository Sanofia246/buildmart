import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, FileText, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Kancheepuram', 'Namakkal', 'Karur', 'Cuddalore', 'Villupuram', 'Krishnagiri', 'Dharmapuri', 'Nilgiris', 'Tiruppur'];

export default function RegisterSupplierPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: '', description: '', gst_number: '', established_year: '',
    address_line1: '', address_line2: '', city: '', district: '', pincode: '',
    website_url: '',
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const toggleCat = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (!form.business_name || !form.city || !form.district) { toast.error('Please fill all required fields'); return; }
    if (!selectedCats.length) { toast.error('Please select at least one category'); return; }
    setLoading(true);
    try {
      await api.post('/suppliers', { ...form, categories: selectedCats });
      toast.success('Business registered successfully! 🎉');
      navigate('/dashboard/supplier');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const steps = ['Business Info', 'Location', 'Categories', 'Review'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-4xl font-extrabold text-gray-900 tracking-wide">List Your Business</h1>
        <p className="text-gray-500 mt-2">Reach thousands of buyers across Tamil Nadu for free</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center mb-10 gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-brand-600' : 'text-gray-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold tracking-wide mb-5">Business Information</h2>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Business Name *</label>
              <input name="business_name" value={form.business_name} onChange={handleChange} required className="input-field" placeholder="e.g. Sri Murugan Steel Industries" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">About Your Business</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field resize-none" placeholder="Describe your products, experience, specializations..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">GST Number</label>
                <input name="gst_number" value={form.gst_number} onChange={handleChange} className="input-field" placeholder="33XXXXX..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Established Year</label>
                <input name="established_year" type="number" value={form.established_year} onChange={handleChange} className="input-field" placeholder="e.g. 2005" min="1900" max="2024" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Website (optional)</label>
              <input name="website_url" value={form.website_url} onChange={handleChange} className="input-field" placeholder="https://yourwebsite.com" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold tracking-wide mb-5">Business Location</h2>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Address Line 1 *</label>
              <input name="address_line1" value={form.address_line1} onChange={handleChange} className="input-field" placeholder="Shop/Building No., Street" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Address Line 2</label>
              <input name="address_line2" value={form.address_line2} onChange={handleChange} className="input-field" placeholder="Area, Landmark" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">City *</label>
                <input name="city" value={form.city} onChange={handleChange} required className="input-field" placeholder="e.g. Coimbatore" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">District *</label>
                <select name="district" value={form.district} onChange={handleChange} required className="input-field">
                  <option value="">Select District</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pincode</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="6 digit pincode" maxLength={6} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide mb-2">Material Categories</h2>
            <p className="text-gray-500 text-sm mb-6">Select all categories that apply to your business</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${selectedCats.includes(cat.id) ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-semibold text-gray-900 leading-tight">{cat.name}</div>
                  {selectedCats.includes(cat.id) && <CheckCircle className="w-4 h-4 text-brand-600 mt-1" />}
                </button>
              ))}
            </div>
            {selectedCats.length > 0 && <p className="text-sm text-brand-600 font-semibold mt-4">{selectedCats.length} categories selected</p>}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide mb-6">Review & Submit</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">{form.business_name}</h3>
                <p className="text-sm text-gray-600">{form.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl"><span className="text-gray-500">City:</span> <span className="font-semibold">{form.city}</span></div>
                <div className="p-3 bg-gray-50 rounded-xl"><span className="text-gray-500">District:</span> <span className="font-semibold">{form.district}</span></div>
                {form.gst_number && <div className="p-3 bg-gray-50 rounded-xl"><span className="text-gray-500">GST:</span> <span className="font-semibold">{form.gst_number}</span></div>}
                {form.established_year && <div className="p-3 bg-gray-50 rounded-xl"><span className="text-gray-500">Est.:</span> <span className="font-semibold">{form.established_year}</span></div>}
              </div>
              <div className="p-4 bg-brand-50 rounded-xl">
                <h4 className="text-sm font-semibold text-brand-700 mb-2">Categories ({selectedCats.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCats.map(id => {
                    const cat = categories.find(c => c.id === id);
                    return cat ? <span key={id} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">{cat.icon} {cat.name}</span> : null;
                  })}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-700 font-medium">✅ Your listing will be live immediately. Our team will verify it within 24-48 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="btn-secondary px-6">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary px-8">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary px-8 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Registering...' : 'Submit Listing 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
