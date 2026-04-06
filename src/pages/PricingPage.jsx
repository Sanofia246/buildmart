import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, X, Zap, Crown, Building2, Star, ArrowRight, Phone } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLAN_ICONS = { free: Building2, pro: Zap, enterprise: Crown };
const PLAN_COLORS = {
  free: { badge: 'bg-gray-100 text-gray-700', btn: 'btn-secondary', border: 'border-gray-200', header: 'bg-gray-50' },
  pro: { badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors', border: 'border-blue-400 shadow-blue-100 shadow-xl', header: 'bg-blue-600' },
  enterprise: { badge: 'bg-brand-100 text-brand-700', btn: 'bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors', border: 'border-brand-400', header: 'bg-brand-600' },
};

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    api.get('/plans').then(r => { setPlans(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleChoose = async (plan) => {
    if (plan.slug === 'free') {
      if (!user) { navigate('/vendor-signup'); return; }
      navigate('/vendor');
      return;
    }
    if (!user) { navigate('/vendor-signup', { state: { planSlug: plan.slug } }); return; }
    if (user.role !== 'supplier') { toast.error('Please register as a vendor first'); navigate('/register-supplier'); return; }

    // Simulate payment flow (in production integrate Razorpay)
    setUpgrading(plan.slug);
    try {
      await api.post('/vendor/upgrade', { plan_slug: plan.slug, billing_cycle: billing, payment_reference: 'demo_' + Date.now() });
      toast.success(`🎉 Upgraded to ${plan.name} plan!`);
      navigate('/vendor/plan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    }
    setUpgrading('');
  };

  const getPrice = (plan) => billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const getSaving = (plan) => plan.price_monthly > 0 ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100) : 0;

  const features = [
    { key: 'max_products', label: 'Product Listings', format: v => v >= 999999 ? 'Unlimited' : `Up to ${v}` },
    { key: 'max_images_per_product', label: 'Images per Product', format: v => `${v} images` },
    { key: 'featured_listing', label: 'Featured Listing', format: v => v },
    { key: 'priority_ranking', label: 'Search Priority', format: v => v === 0 ? 'Standard' : v >= 20 ? 'Highest' : 'High' },
    { key: 'verified_badge', label: 'Verified Badge', format: v => v },
    { key: 'analytics_dashboard', label: 'Analytics Dashboard', format: v => v },
    { key: 'unlimited_leads', label: 'Unlimited Leads', format: v => v },
    { key: 'response_support', label: 'Support', format: v => v },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-brand-500/30">
          <Crown className="w-4 h-4" /> Simple, Transparent Pricing
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-extrabold text-white tracking-wide mb-4">
          VENDOR PRICING PLANS
        </h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
          Choose the right plan for your business. Get featured listings, more leads, and grow faster.
        </p>
        {/* Billing toggle */}
        <div className="inline-flex items-center bg-gray-800 rounded-xl p-1 gap-1">
          {['monthly', 'yearly'].map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === b ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}>
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">Save 17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const colors = PLAN_COLORS[plan.slug] || PLAN_COLORS.free;
              const Icon = PLAN_ICONS[plan.slug] || Building2;
              const price = getPrice(plan);
              const saving = getSaving(plan);
              const isMostPopular = plan.slug === 'pro';

              return (
                <div key={plan.id} className={`relative bg-white rounded-2xl border-2 ${colors.border} overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl duration-200`}>
                  {isMostPopular && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  {/* Plan header */}
                  <div className={`${colors.header} p-6 ${plan.slug !== 'free' ? 'text-white' : ''}`}>
                    <div className={`w-12 h-12 ${plan.slug !== 'free' ? 'bg-white/20' : 'bg-gray-200'} rounded-2xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${plan.slug !== 'free' ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`font-display text-2xl font-extrabold tracking-wide ${plan.slug === 'free' ? 'text-gray-900' : 'text-white'}`}>{plan.name}</h3>
                    <div className="mt-3">
                      <span className={`text-4xl font-display font-extrabold ${plan.slug === 'free' ? 'text-gray-900' : 'text-white'}`}>
                        {price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}
                      </span>
                      {price > 0 && <span className={`text-sm ml-1 ${plan.slug === 'free' ? 'text-gray-500' : 'text-white/70'}`}>/{billing === 'monthly' ? 'month' : 'year'}</span>}
                      {billing === 'yearly' && saving > 0 && <div className="text-sm font-semibold text-green-300 mt-1">Save {saving}% vs monthly</div>}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6">
                    <ul className="space-y-3 mb-8">
                      {features.map(({ key, label, format }) => {
                        const val = plan[key];
                        const bool = typeof val === 'boolean';
                        return (
                          <li key={key} className="flex items-center gap-3 text-sm">
                            {bool ? (
                              val ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <X className="w-4 h-4 text-gray-300 shrink-0" />
                            ) : <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                            <span className={bool && !val ? 'text-gray-400' : 'text-gray-700'}>
                              <span className="font-medium">{label}:</span> {bool ? (val ? 'Included' : 'Not included') : format(val)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {plan.slug === 'enterprise' ? (
                      <a href="tel:+919876543210" className={`w-full flex items-center justify-center gap-2 ${colors.btn}`}>
                        <Phone className="w-4 h-4" /> Contact Sales
                      </a>
                    ) : (
                      <button onClick={() => handleChoose(plan)} disabled={upgrading === plan.slug}
                        className={`w-full flex items-center justify-center gap-2 ${colors.btn} ${plan.slug === 'free' ? 'border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors' : ''}`}>
                        {upgrading === plan.slug ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
                        {plan.slug === 'free' ? 'Get Started Free' : `Upgrade to ${plan.name}`}
                        {!upgrading && plan.slug !== 'free' && <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="font-display text-3xl font-extrabold text-gray-900 text-center mb-8 tracking-wide">FULL FEATURE COMPARISON</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-1/3">Feature</th>
                    {plans.map(p => (
                      <th key={p.id} className="px-6 py-4 text-center text-sm font-bold text-gray-900">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {features.map(({ key, label, format }) => (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">{label}</td>
                      {plans.map(p => {
                        const val = p[key];
                        const bool = typeof val === 'boolean';
                        return (
                          <td key={p.id} className="px-6 py-3.5 text-center text-sm">
                            {bool ? (val ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />)
                              : <span className="font-medium text-gray-900">{format(val)}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ / CTA */}
        <div className="mt-16 text-center bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-10 text-white">
          <Star className="w-10 h-10 mx-auto mb-4 text-brand-200" />
          <h3 className="font-display text-3xl font-extrabold tracking-wide mb-3">NOT SURE WHICH PLAN?</h3>
          <p className="text-brand-100 mb-6 max-w-md mx-auto">Start with Free and upgrade anytime. Our team is here to help you choose the right plan for your business.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/vendor-signup" className="bg-white text-brand-700 hover:bg-brand-50 font-bold px-8 py-3 rounded-xl transition-colors">Start Free Today</Link>
            <a href="tel:+919876543210" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> Talk to Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
