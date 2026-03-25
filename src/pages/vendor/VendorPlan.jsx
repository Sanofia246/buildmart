import { useState, useEffect } from 'react';
import { Crown, CheckCircle, X, Zap, Building2, ArrowRight, Loader2, Calendar, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { Spinner } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ICONS = { free: Building2, pro: Zap, enterprise: Crown };
const COLORS = {
  free: 'border-gray-200 bg-gray-50',
  pro: 'border-blue-400 bg-blue-50 shadow-blue-100 shadow-lg',
  enterprise: 'border-brand-400 bg-brand-50',
};
const BTN = {
  free: 'btn-secondary',
  pro: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors',
  enterprise: 'btn-primary',
};

export default function VendorPlan() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState('monthly');
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    Promise.all([api.get('/vendor/plan'), api.get('/plans')])
      .then(([cur, all]) => { setCurrentPlan(cur.data.data); setAllPlans(all.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    if (plan.slug === currentPlan?.slug) { toast('You are already on this plan'); return; }
    if (plan.slug === 'enterprise') { window.location.href = 'tel:+919876543210'; return; }
    setUpgrading(plan.slug);
    try {
      await api.post('/vendor/upgrade', { plan_slug: plan.slug, billing_cycle: billing, payment_reference: 'demo_' + Date.now() });
      toast.success(`🎉 Upgraded to ${plan.name}!`);
      const res = await api.get('/vendor/plan');
      setCurrentPlan(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Upgrade failed'); }
    setUpgrading('');
  };

  const getPrice = (plan) => billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const daysLeft = currentPlan?.plan_expires_at ? Math.ceil((new Date(currentPlan.plan_expires_at) - new Date()) / (1000*60*60*24)) : null;

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const activePlanSlug = currentPlan?.slug || 'free';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">My Plan</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your BuildMart subscription</p>
      </div>

      {/* Current plan status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activePlanSlug === 'pro' ? 'bg-blue-100' : activePlanSlug === 'enterprise' ? 'bg-brand-100' : 'bg-gray-100'}`}>
              {activePlanSlug === 'enterprise' ? <Crown className="w-7 h-7 text-brand-600" /> : activePlanSlug === 'pro' ? <Zap className="w-7 h-7 text-blue-600" /> : <Building2 className="w-7 h-7 text-gray-500" />}
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gray-900 tracking-wide">{currentPlan?.name || 'Free'} Plan</div>
              {daysLeft !== null && daysLeft > 0 ? (
                <div className={`flex items-center gap-1.5 text-sm mt-1 ${daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  <Calendar className="w-4 h-4" />
                  {daysLeft <= 7 ? <><AlertCircle className="w-4 h-4" />Expires in {daysLeft} days!</> : `Active until ${new Date(currentPlan.plan_expires_at).toLocaleDateString('en-IN')}`}
                </div>
              ) : activePlanSlug !== 'free' ? (
                <div className="text-sm text-gray-400 mt-1">No expiry date set</div>
              ) : (
                <div className="text-sm text-gray-500 mt-1">Free forever — upgrade for more features</div>
              )}
            </div>
          </div>
          {activePlanSlug !== 'free' && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-2 rounded-xl border border-green-100">
              <CheckCircle className="w-4 h-4" /> Active Subscription
            </div>
          )}
        </div>

        {/* Current plan features */}
        {currentPlan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {[
              { label: 'Products', value: currentPlan.max_products >= 999999 ? '∞ Unlimited' : `Up to ${currentPlan.max_products}` },
              { label: 'Images/Product', value: `${currentPlan.max_images_per_product} images` },
              { label: 'Featured Listing', value: currentPlan.featured_listing ? '✅ Yes' : '❌ No' },
              { label: 'Support', value: currentPlan.response_support },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-sm font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-gray-700 text-sm">Billing:</span>
        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {['monthly', 'yearly'].map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${billing === b ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              {b === 'monthly' ? 'Monthly' : <>Yearly <span className="text-green-600 text-xs">Save 17%</span></>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {allPlans.map(plan => {
          const Icon = ICONS[plan.slug] || Building2;
          const price = getPrice(plan);
          const isCurrent = plan.slug === activePlanSlug;
          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${isCurrent ? 'border-brand-500 shadow-brand-100 shadow-lg' : COLORS[plan.slug] || 'border-gray-200'}`}>
              {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Current Plan</div>}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${plan.slug === 'pro' ? 'bg-blue-100' : plan.slug === 'enterprise' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                <Icon className={`w-6 h-6 ${plan.slug === 'pro' ? 'text-blue-600' : plan.slug === 'enterprise' ? 'text-brand-600' : 'text-gray-500'}`} />
              </div>
              <h3 className="font-display text-xl font-extrabold text-gray-900 tracking-wide">{plan.name}</h3>
              <div className="mt-2 mb-5">
                <span className="text-3xl font-display font-extrabold text-gray-900">{price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}</span>
                {price > 0 && <span className="text-sm text-gray-400 ml-1">/{billing === 'monthly' ? 'mo' : 'yr'}</span>}
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                {[
                  `${plan.max_products >= 999999 ? 'Unlimited' : plan.max_products} products`,
                  `${plan.max_images_per_product} images per product`,
                  plan.featured_listing ? '✅ Featured listing' : null,
                  plan.verified_badge ? '✅ Verified badge' : null,
                  plan.analytics_dashboard ? '✅ Analytics dashboard' : null,
                  plan.unlimited_leads ? '✅ Unlimited leads' : null,
                  `Support: ${plan.response_support}`,
                ].filter(Boolean).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    {f.startsWith('✅') ? null : <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade(plan)} disabled={isCurrent || upgrading === plan.slug}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : BTN[plan.slug] || 'btn-secondary'}`}>
                {upgrading === plan.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isCurrent ? 'Current Plan' : plan.slug === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                {!isCurrent && !upgrading && plan.slug !== 'enterprise' && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Need a custom plan for your business? We offer custom pricing for large enterprises.</p>
        <a href="tel:+919876543210" className="text-brand-600 font-semibold text-sm hover:text-brand-700">📞 Contact our sales team →</a>
      </div>
    </div>
  );
}
