import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, CheckCircle, Clock, Globe, MapPin, Loader2, Save, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { Spinner } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';

const DISTRICTS = ['Chennai','Coimbatore','Madurai','Salem','Trichy','Tirunelveli','Erode','Vellore','Thanjavur','Dindigul','Kancheepuram','Namakkal','Karur','Cuddalore','Villupuram','Krishnagiri','Dharmapuri','Nilgiris','Tiruppur','Ramanathapuram'];

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState({});
  const [selectedCats, setSelectedCats] = useState([]);
  const logoRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/vendor/profile'), api.get('/categories')])
      .then(([p, c]) => {
        const prof = p.data.data;
        setProfile(prof);
        setCategories(c.data.data || []);
        setForm({
          business_name: prof.business_name || '',
          description: prof.description || '',
          gst_number: prof.gst_number || '',
          pan_number: prof.pan_number || '',
          established_year: prof.established_year || '',
          address_line1: prof.address_line1 || '',
          address_line2: prof.address_line2 || '',
          city: prof.city || '',
          district: prof.district || '',
          pincode: prof.pincode || '',
          website_url: prof.website_url || '',
        });
        const catIds = prof.categories?.filter(c => c?.id).map(c => c.id) || [];
        setSelectedCats(catIds);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/vendor/profile', { ...form, categories: selectedCats });
      toast.success('Profile updated successfully!');
      setProfile(prev => ({ ...prev, ...form }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/vendor/upload/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, logo_url: res.data.data.url }));
      toast.success('Logo uploaded!');
    } catch { toast.error('Logo upload failed'); }
    setUploadingLogo(false);
    e.target.value = '';
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append('banner', file);
      const res = await api.post('/vendor/upload/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, banner_url: res.data.data.url }));
      toast.success('Banner uploaded!');
    } catch { toast.error('Banner upload failed'); }
    setUploadingBanner(false);
    e.target.value = '';
  };

  const toggleCat = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!profile) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">No vendor profile found.</p>
      <a href="/register-supplier" className="btn-primary">Create Profile</a>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">Business Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your public-facing business information</p>
        </div>
        <div className="flex gap-3">
          {profile.slug && (
            <a href={`/suppliers/${profile.slug}`} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> View Page
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-semibold border ${profile.is_verified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
        {profile.is_verified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        {profile.is_verified ? 'Your business is verified ✓' : 'Verification pending — our team will review within 24–48 hours'}
      </div>

      {/* Banner / Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="relative h-44 bg-gradient-to-br from-gray-700 to-gray-900">
          {profile.banner_url
            ? <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center h-full text-gray-500 text-sm">No banner uploaded</div>
          }
          <button onClick={() => bannerRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploadingBanner ? 'Uploading...' : 'Change Banner'}
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        {/* Logo + name */}
        <div className="px-6 pb-5 -mt-8">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-brand-600 flex items-center justify-center text-white font-display text-3xl font-extrabold overflow-hidden">
                {profile.logo_url ? <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" /> : profile.business_name?.charAt(0)}
              </div>
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-brand-700 transition-colors">
                {uploadingLogo ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Upload className="w-3 h-3 text-white" />}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div className="pt-8">
              <h2 className="font-display text-xl font-bold text-gray-900">{profile.business_name}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[profile.city, profile.district].filter(Boolean).join(', ') || 'Location not set'}</span>
                {profile.average_rating > 0 && <span>⭐ {parseFloat(profile.average_rating).toFixed(1)} ({profile.total_reviews} reviews)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-display text-lg font-bold tracking-wide mb-5">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Business Name *</label>
            <input value={form.business_name} onChange={f('business_name')} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">About Your Business</label>
            <textarea value={form.description} onChange={f('description')} rows={4} className="input-field resize-none" placeholder="Describe your products, specializations, experience..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">GST Number</label>
            <input value={form.gst_number} onChange={f('gst_number')} className="input-field" placeholder="33XXXXX..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">PAN Number</label>
            <input value={form.pan_number} onChange={f('pan_number')} className="input-field" placeholder="XXXXX0000X" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Established Year</label>
            <input type="number" value={form.established_year} onChange={f('established_year')} className="input-field" placeholder="e.g. 2005" min="1900" max="2025" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.website_url} onChange={f('website_url')} className="input-field pl-10" placeholder="https://yourwebsite.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-display text-lg font-bold tracking-wide mb-5">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Address Line 1</label>
            <input value={form.address_line1} onChange={f('address_line1')} className="input-field" placeholder="Shop/Building No., Street" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Address Line 2</label>
            <input value={form.address_line2} onChange={f('address_line2')} className="input-field" placeholder="Area, Landmark" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">City</label>
            <input value={form.city} onChange={f('city')} className="input-field" placeholder="City name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">District</label>
            <select value={form.district} onChange={f('district')} className="input-field">
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Pincode</label>
            <input value={form.pincode} onChange={f('pincode')} className="input-field" placeholder="6-digit pincode" maxLength={6} />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-display text-lg font-bold tracking-wide mb-2">Material Categories</h3>
        <p className="text-gray-500 text-sm mb-4">Select all categories that apply to your business</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map(cat => (
            <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2 ${selectedCats.includes(cat.id) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs font-semibold text-gray-800 leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
        {selectedCats.length > 0 && <p className="text-xs text-brand-600 font-semibold mt-3">{selectedCats.length} categories selected</p>}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
