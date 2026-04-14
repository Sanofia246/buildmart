import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, ChevronDown, X, MapPin, Search } from 'lucide-react';
import api from '../utils/api';
import SupplierCard from '../components/common/SupplierCard';
import { Spinner, EmptyState } from '../components/common/UIComponents';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Kancheepuram', 'Namakkal', 'Karur', 'Cuddalore', 'Villupuram', 'Krishnagiri', 'Dharmapuri', 'Nilgiris', 'Tiruppur', 'Ramanathapuram'];

export default function SuppliersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    district: searchParams.get('district') || '',
    sort: searchParams.get('sort') || 'rating',
    verified: searchParams.get('verified') || '',
    premium: searchParams.get('premium') || '',
    page: parseInt(searchParams.get('page') || '1'),
  };

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { ...filters, limit: 12 } });
      setSuppliers(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load suppliers'); }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
    if (user) {
      api.get('/saved').then(r => {
        setSavedIds(new Set(r.data.data?.map(s => s.id) || []));
      }).catch(() => {});
    }
  }, [user]);

  const handleSave = async (supplierId) => {
    if (!user) { toast.error('Please login to save suppliers'); return; }
    try {
      if (savedIds.has(supplierId)) {
        await api.delete(`/saved/${supplierId}`);
        setSavedIds(prev => { const n = new Set(prev); n.delete(supplierId); return n; });
        toast.success('Removed from saved');
      } else {
        await api.post(`/saved/${supplierId}`);
        setSavedIds(prev => new Set([...prev, supplierId]));
        toast.success('Supplier saved!');
      }
    } catch { toast.error('Please login first'); }
  };

  const activeFiltersCount = [filters.category, filters.city, filters.verified, filters.premium].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title mb-1">
          {filters.search ? `Results for "${filters.search}"` : filters.city ? `Suppliers in ${filters.city}` : 'All Construction Suppliers'}
        </h1>
        <p className="text-gray-500 text-sm">{pagination.total || 0} suppliers found in Tamil Nadu</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`shrink-0 w-64 ${filterOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold tracking-wide">Filters</h3>
              {activeFiltersCount > 0 && (
                <button onClick={() => setSearchParams(new URLSearchParams())} className="text-xs text-brand-600 font-semibold hover:text-brand-700">
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Business name..." value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cat" checked={!filters.category} onChange={() => updateFilter('category', '')} className="text-brand-600" />
                  <span className="text-sm text-gray-700">All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" checked={filters.category === cat.slug} onChange={() => updateFilter('category', cat.slug)} className="text-brand-600" />
                    <span className="text-sm text-gray-700">{cat.icon} {cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* District / City */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">District / City</label>
              <select value={filters.city} onChange={e => updateFilter('city', e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">All Tamil Nadu</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Checkboxes */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Supplier Type</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.verified === 'true'} onChange={e => updateFilter('verified', e.target.checked ? 'true' : '')} className="rounded text-brand-600" />
                  <span className="text-sm text-gray-700">✅ Verified Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.premium === 'true'} onChange={e => updateFilter('premium', e.target.checked ? 'true' : '')} className="rounded text-brand-600" />
                  <span className="text-sm text-gray-700">⭐ Premium Only</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <button onClick={() => setFilterOpen(!filterOpen)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filters {activeFiltersCount > 0 && <span className="bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
              <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="newest">Newest</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.category && <FilterChip label={filters.category} onRemove={() => updateFilter('category', '')} />}
              {filters.city && <FilterChip label={filters.city} onRemove={() => updateFilter('city', '')} />}
              {filters.verified === 'true' && <FilterChip label="Verified" onRemove={() => updateFilter('verified', '')} />}
              {filters.premium === 'true' && <FilterChip label="Premium" onRemove={() => updateFilter('premium', '')} />}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-24"><Spinner size="lg" /></div>
          ) : suppliers.length === 0 ? (
            <EmptyState icon="🔍" title="No Suppliers Found"
              description="Try adjusting your filters or search in a different area."
              action={<button onClick={() => setSearchParams(new URLSearchParams())} className="btn-primary">Clear Filters</button>} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {suppliers.map(s => (
                  <SupplierCard key={s.id} supplier={s} onSave={handleSave} saved={savedIds.has(s.id)} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => updateFilter('page', page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${filters.page === page ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300'}`}>
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900"><X className="w-3 h-3" /></button>
    </span>
  );
}
