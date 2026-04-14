import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage({ defaultRole = 'buyer' }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', role: defaultRole });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name:form.name, email:form.email, phone:form.phone, password:form.password, role:form.role });
      toast.success('Account created successfully!');
      if (form.role === 'supplier') navigate('/register-supplier');
      else navigate('/');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    setLoading(false);
  };

  const isVendor = form.role === 'supplier';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-brand-600 rounded-lg p-1.5"><Building2 className="w-5 h-5 text-white" /></div>
            <span className="font-display text-2xl font-extrabold tracking-wide">BUILD<span className="text-brand-600">MART</span></span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">{isVendor ? 'Vendor Signup' : 'Create Account'}</h1>
          <p className="text-gray-500 mt-1 text-sm">{isVendor ? 'List your business on BuildMart' : 'Join Tamil Nadu\'s construction network'}</p>
        </div>
        <div className="card p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{value:'buyer',label:'🛍️ I\'m a Buyer',desc:'Find suppliers'},{value:'supplier',label:'🏭 I\'m a Vendor',desc:'List my business'}].map(r=>(
              <button key={r.value} type="button" onClick={()=>setForm(p=>({...p,role:r.value}))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${form.role===r.value?'border-brand-600 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-sm font-bold text-gray-900">{r.label}</div>
                <div className="text-xs text-gray-500">{r.desc}</div>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required className="input-field pl-10" placeholder="Your full name" /></div>
            </div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required className="input-field pl-10" placeholder="you@example.com" /></div>
            </div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} required className="input-field pl-10" placeholder="+91 XXXXX XXXXX" /></div>
            </div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPwd?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required className="input-field pl-10 pr-10" placeholder="Min. 6 characters" />
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="password" value={form.confirmPassword} onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))} required className="input-field pl-10" placeholder="Repeat password" /></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mt-2">
              {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}
              {loading?'Creating Account...':isVendor?'Create Vendor Account':'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
