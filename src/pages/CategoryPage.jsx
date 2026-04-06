import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import SupplierCard from '../components/common/SupplierCard';
import { Spinner, EmptyState } from '../components/common/UIComponents';
import { ChevronRight } from 'lucide-react';

export function CategoryPage() {
  const { slug } = useParams();
  const [suppliers, setSuppliers] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    api.get('/categories').then(r => {
      const cat = r.data.data?.find(c => c.slug === slug);
      setCategory(cat);
    }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    api.get('/suppliers', { params: { category: slug, page, limit: 12 } })
      .then(r => { setSuppliers(r.data.data || []); setPagination(r.data.pagination || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/suppliers" className="hover:text-brand-600">Suppliers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{category?.name || slug}</span>
      </div>

      {category && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 mb-8 text-white">
          <div className="text-5xl mb-3">{category.icon}</div>
          <h1 className="font-display text-4xl font-extrabold tracking-wide mb-2">{category.name}</h1>
          <p className="text-brand-100">{category.description}</p>
          {category.supplier_count > 0 && <div className="mt-3 text-brand-200 text-sm">{category.supplier_count} suppliers available</div>}
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : suppliers.length === 0 ? <EmptyState icon="🔍" title="No Suppliers Found" description="No suppliers in this category yet." action={<Link to="/register-supplier" className="btn-primary">Be the First!</Link>} />
        : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)}
            </div>
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-display text-5xl font-extrabold text-gray-900 tracking-wide mb-4">ABOUT BUILDMART</h1>
        <p className="text-xl text-gray-500">Tamil Nadu's trusted construction material supplier platform</p>
      </div>

      <div className="space-y-8">
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 tracking-wide mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">BuildMart was founded with a simple mission: to connect construction professionals across Tamil Nadu with the best raw material suppliers quickly and transparently. We believe every builder deserves access to quality materials at fair prices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[{ n: '500+', l: 'Verified Suppliers' }, { n: '38', l: 'Districts Covered' }, { n: '10,000+', l: 'Buyer Inquiries' }].map(s => (
            <div key={s.l} className="card p-6 text-center">
              <div className="font-display text-4xl font-extrabold text-brand-600 mb-1">{s.n}</div>
              <div className="text-gray-500 text-sm">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 tracking-wide mb-4">Contact Us</h2>
          <div className="space-y-3 text-gray-600">
            <p>📍 Anna Salai, Chennai – 600002, Tamil Nadu</p>
            <p>📞 +91 99999 99999</p>
            <p>📧 info@buildmart.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
