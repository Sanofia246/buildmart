import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, CheckCircle, Star, MessageSquare, Award, Clock, Package, ChevronRight, Heart, Share2, Loader2, Building2 } from 'lucide-react';
import api from '../utils/api';
import { StarRating } from '../components/common/UIComponents';
import InquiryModal from '../components/suppliers/InquiryModal';
import ReviewForm from '../components/suppliers/ReviewForm';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SupplierDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/suppliers/${slug}`)
      .then(r => { setSupplier(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!user) { toast.error('Please login to save'); return; }
    try {
      if (saved) { await api.delete(`/saved/${supplier.id}`); setSaved(false); toast.success('Removed'); }
      else { await api.post(`/saved/${supplier.id}`); setSaved(true); toast.success('Saved!'); }
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  );

  if (!supplier) return (
    <div className="text-center py-24">
      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Supplier Not Found</h2>
      <Link to="/suppliers" className="btn-primary inline-block">Browse Suppliers</Link>
    </div>
  );

  const ratingBreakdown = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: supplier.reviews?.filter(rv => rv.rating === r).length || 0,
    pct: supplier.total_reviews > 0 ? ((supplier.reviews?.filter(rv => rv.rating === r).length || 0) / supplier.total_reviews * 100) : 0
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/suppliers" className="hover:text-brand-600">Suppliers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 truncate">{supplier.business_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card overflow-hidden">
            <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
              {supplier.banner_url && <img src={supplier.banner_url} alt="" className="w-full h-full object-cover opacity-70" />}
              {supplier.is_premium && (
                <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> PREMIUM SUPPLIER
                </div>
              )}
            </div>
            <div className="p-6 -mt-10 relative">
              <div className="flex items-end gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-brand-600 flex items-center justify-center text-white font-display text-3xl font-extrabold shrink-0">
                  {supplier.logo_url ? <img src={supplier.logo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : supplier.business_name?.charAt(0)}
                </div>
                <div className="pb-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 tracking-wide">{supplier.business_name}</h1>
                    {supplier.is_verified && (
                      <span className="badge-verified"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={supplier.average_rating || 0} size="md" />
                      <span className="font-bold text-gray-900">{parseFloat(supplier.average_rating || 0).toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({supplier.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {supplier.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {supplier.categories.filter(c => c && c.name).map((cat, i) => (
                    <Link key={i} to={`/category/${cat.slug}`}
                      className="text-sm bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-medium hover:bg-brand-100 transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Info row */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-500" />{[supplier.city, supplier.district, 'Tamil Nadu'].filter(Boolean).join(', ')}</div>
                {supplier.established_year && <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-500" />Est. {supplier.established_year}</div>}
                {supplier.products?.length > 0 && <div className="flex items-center gap-1.5"><Package className="w-4 h-4 text-brand-500" />{supplier.products.length} Products</div>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="flex border-b border-gray-100 px-4 overflow-x-auto scrollbar-hide">
              {['overview', 'products', 'reviews', 'contact'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                  {tab === 'reviews' && ` (${supplier.total_reviews})`}
                  {tab === 'products' && ` (${supplier.products?.length || 0})`}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {supplier.description && (
                    <div>
                      <h3 className="font-display text-lg font-bold mb-2 tracking-wide">About Us</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{supplier.description}</p>
                    </div>
                  )}
                  {supplier.certifications?.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-bold mb-3 tracking-wide">Certifications</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {supplier.certifications.map(cert => (
                          <div key={cert.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                            <Award className="w-5 h-5 text-green-600 shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{cert.name}</div>
                              {cert.issuing_body && <div className="text-xs text-gray-500">{cert.issuing_body}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {[
                      { label: 'Rating', value: parseFloat(supplier.average_rating || 0).toFixed(1), suffix: '/5' },
                      { label: 'Reviews', value: supplier.total_reviews || 0 },
                      { label: 'Response Rate', value: `${supplier.response_rate || 0}%` },
                    ].map(({ label, value, suffix }) => (
                      <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-display font-extrabold text-brand-600">{value}<span className="text-sm">{suffix}</span></div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  {supplier.products?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p>No products listed yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {supplier.products.map(product => (
                        <div key={product.id} className="border border-gray-100 rounded-xl p-4 hover:border-brand-200 hover:bg-brand-50/30 transition-colors">
                          <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                          {product.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>}
                          {(product.price_min || product.price_max) && (
                            <div className="text-sm font-bold text-brand-600">
                              ₹{product.price_min}{product.price_max && product.price_max !== product.price_min ? ` - ₹${product.price_max}` : ''} / {product.price_unit}
                            </div>
                          )}
                          {product.min_order_quantity && (
                            <div className="text-xs text-gray-400 mt-1">Min. Order: {product.min_order_quantity} {product.min_order_unit}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-5">
                  {supplier.total_reviews > 0 && (
                    <div className="flex gap-6 mb-6 p-5 bg-gray-50 rounded-2xl">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-display font-extrabold text-gray-900">{parseFloat(supplier.average_rating || 0).toFixed(1)}</div>
                        <StarRating rating={supplier.average_rating || 0} size="md" />
                        <div className="text-xs text-gray-500 mt-1">{supplier.total_reviews} reviews</div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {ratingBreakdown.map(({ star, count, pct }) => (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-current" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-4 text-gray-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {user && (
                    <button onClick={() => setReviewOpen(true)} className="btn-outline w-full">
                      Write a Review
                    </button>
                  )}

                  <div className="space-y-4">
                    {supplier.reviews?.map(review => (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {review.reviewer_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">{review.reviewer_name}</span>
                              <StarRating rating={review.rating} />
                            </div>
                            {review.title && <div className="font-medium text-sm text-gray-800 mb-1">{review.title}</div>}
                            <p className="text-sm text-gray-600">{review.comment}</p>
                            <div className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {supplier.reviews?.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">No reviews yet. Be the first to review!</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  {supplier.phone && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-brand-600 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <a href={`tel:${supplier.phone}`} className="font-semibold text-gray-900 hover:text-brand-600">{supplier.phone}</a>
                      </div>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-brand-600 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <a href={`mailto:${supplier.email}`} className="font-semibold text-gray-900 hover:text-brand-600">{supplier.email}</a>
                      </div>
                    </div>
                  )}
                  {supplier.address_line1 && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="font-semibold text-gray-900">
                          {[supplier.address_line1, supplier.address_line2, supplier.city, supplier.district, supplier.pincode].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  {supplier.website_url && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <Globe className="w-5 h-5 text-brand-600 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Website</div>
                        <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-brand-600">{supplier.website_url}</a>
                      </div>
                    </div>
                  )}
                  {supplier.gst_number && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="text-xs text-gray-500 mb-1">GST Number</div>
                      <div className="font-mono font-bold text-gray-900">{supplier.gst_number}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Action card */}
          <div className="card p-5 sticky top-24">
            <button onClick={() => setInquiryOpen(true)} className="btn-primary w-full text-base py-3 mb-3">
              <MessageSquare className="w-5 h-5 inline-block mr-2" />
              Send Inquiry
            </button>
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`} className="btn-secondary w-full text-base py-3 mb-3 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
            <div className="flex gap-2">
              <button onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => { navigator.share?.({ title: supplier.business_name, url: window.location.href }); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Response Rate</span>
                <span className="font-semibold text-gray-900">{supplier.response_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-semibold text-gray-900">{new Date(supplier.created_at).getFullYear()}</span>
              </div>
              {supplier.is_verified && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Verified Business
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {inquiryOpen && <InquiryModal supplier={supplier} onClose={() => setInquiryOpen(false)} />}
      {reviewOpen && <ReviewForm supplierId={supplier.id} onClose={() => setReviewOpen(false)} onSuccess={() => { setReviewOpen(false); window.location.reload(); }} />}
    </div>
  );
}
