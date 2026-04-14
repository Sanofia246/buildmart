import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Star, TrendingUp, Phone, ChevronRight, Building, Users, Package, Award } from 'lucide-react';
import api from '../utils/api';
import SupplierCard from '../components/common/SupplierCard';
import { Spinner } from '../components/common/UIComponents';

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul'];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [stats, setStats] = useState({ suppliers: '500+', cities: '38', categories: '12', inquiries: '10000+' });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
    api.get('/suppliers/featured').then(r => { setFeatured(r.data.data || []); setLoadingFeatured(false); }).catch(() => setLoadingFeatured(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/suppliers?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-96 h-96 bg-brand-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-brand-500/30">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              Tamil Nadu's #1 Construction Supplier Platform
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white mb-5 leading-none tracking-wide">
              FIND TRUSTED<br />
              <span className="text-brand-400">CONSTRUCTION</span><br />
              SUPPLIERS
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Connect with verified cement, steel, sand, tiles and all raw material suppliers across all 38 districts of Tamil Nadu
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search cement, steel, bricks, sand..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                  className="flex-1 py-2.5 text-gray-700 focus:outline-none text-sm bg-transparent appearance-none cursor-pointer">
                  <option value="">All of Tamil Nadu</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary rounded-xl text-base px-8 whitespace-nowrap">
                Search Suppliers
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Cement', 'TMT Steel', 'River Sand', 'Red Bricks', 'Roof Tiles', 'PVC Pipes'].map(t => (
              <button key={t} onClick={() => { setSearchQuery(t); navigate(`/suppliers?search=${t}`); }}
                className="text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/10">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-brand-700 border-t border-brand-600">
          <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building, label: 'Verified Suppliers', value: stats.suppliers },
              { icon: MapPin, label: 'Districts Covered', value: stats.cities },
              { icon: Package, label: 'Material Categories', value: stats.categories },
              { icon: Users, label: 'Buyer Inquiries', value: stats.inquiries },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-200" />
                </div>
                <div>
                  <div className="text-2xl font-display font-extrabold text-white leading-none">{value}</div>
                  <div className="text-xs text-brand-200 mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Shop by Material</h2>
              <p className="text-gray-500 mt-1">Find suppliers for every construction need</p>
            </div>
            <Link to="/suppliers" className="text-brand-600 font-semibold text-sm hover:text-brand-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 hover:shadow-md transition-all duration-200 text-center">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-brand-700 leading-tight">{cat.name}</span>
                {cat.supplier_count > 0 && (
                  <span className="text-xs text-gray-400 mt-1">{cat.supplier_count} suppliers</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SUPPLIERS ── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Suppliers</h2>
              <p className="text-gray-500 mt-1">Top-rated and premium verified suppliers</p>
            </div>
            <Link to="/suppliers?premium=true" className="text-brand-600 font-semibold text-sm hover:text-brand-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingFeatured ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No featured suppliers yet. <Link to="/register-supplier" className="text-brand-600 font-semibold">Be the first!</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(s => <SupplierCard key={s.id} supplier={s} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── BROWSE BY CITY ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="section-title text-center mb-2">Find Suppliers Near You</h2>
          <p className="text-center text-gray-500 mb-8">Covering all major cities across Tamil Nadu</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {DISTRICTS.map(city => (
              <Link key={city} to={`/suppliers?city=${city}`}
                className="flex items-center gap-2 p-3.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm transition-all group">
                <MapPin className="w-4 h-4 text-brand-500 group-hover:text-brand-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">{city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BUILDMART ── */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl font-extrabold text-center mb-2 tracking-wide">WHY CHOOSE BUILDMART?</h2>
          <p className="text-center text-gray-400 mb-12">Trusted by thousands of builders and contractors across Tamil Nadu</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verified Suppliers', desc: 'Every supplier on our platform is manually verified with GST, business registration and quality checks.', color: 'text-green-400' },
              { icon: Star, title: 'Genuine Reviews', desc: 'Read authentic reviews from real buyers who have purchased from these suppliers.', color: 'text-amber-400' },
              { icon: TrendingUp, title: 'Best Prices', desc: 'Compare multiple suppliers and get competitive quotes for bulk orders directly.', color: 'text-blue-400' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 ${color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 tracking-wide">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-wide">
            ARE YOU A SUPPLIER?
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
            List your construction material business on BuildMart and reach thousands of buyers across Tamil Nadu — completely free to start!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-supplier" className="bg-white text-brand-700 hover:bg-brand-50 font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg">
              List Your Business Free
            </Link>
            <a href="tel:+919999999999" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
