import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, X, Image, Loader2, Package, Edit2, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { Spinner, EmptyState } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';

const UNITS = ['ton', 'bag', 'kg', 'piece', 'sq.ft', 'sq.m', 'cubic meter', 'liter', 'bundle', 'feet', 'meter'];

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [imageModal, setImageModal] = useState(null); // productId
  const [productImages, setProductImages] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', price_min: '', price_max: '',
    price_unit: 'ton', min_order_quantity: '1', min_order_unit: 'ton',
    brand: '', sku: '', is_available: true
  });

  useEffect(() => {
    Promise.all([api.get('/vendor/products'), api.get('/categories')])
      .then(([p, c]) => { setProducts(p.data.data || []); setCategories(c.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', category_id: '', price_min: '', price_max: '', price_unit: 'ton', min_order_quantity: '1', min_order_unit: 'ton', brand: '', sku: '', is_available: true });
    setEditProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || '', description: product.description || '',
      category_id: product.category_id || '', price_min: product.price_min || '',
      price_max: product.price_max || '', price_unit: product.price_unit || 'ton',
      min_order_quantity: product.min_order_quantity || '1', min_order_unit: product.min_order_unit || 'ton',
      brand: product.brand || '', sku: product.sku || '', is_available: product.is_available !== false
    });
    setEditProduct(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await api.put(`/vendor/products/${editProduct.id}`, form);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...form } : p));
        toast.success('Product updated!');
      } else {
        const res = await api.post('/vendor/products', form);
        setProducts(prev => [res.data.data, ...prev]);
        toast.success('Product added!');
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleAvailable = async (product) => {
    try {
      await api.put(`/vendor/products/${product.id}`, { is_available: !product.is_available });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    } catch { toast.error('Update failed'); }
  };

  const openImageModal = async (productId) => {
    setImageModal(productId);
    if (!productImages[productId]) {
      try {
        const res = await api.get(`/vendor/products/${productId}/images`);
        setProductImages(prev => ({ ...prev, [productId]: res.data.data || [] }));
      } catch {}
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await api.post(`/vendor/products/${imageModal}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrls = res.data.data;
      setProductImages(prev => ({ ...prev, [imageModal]: [...(prev[imageModal] || []), ...newUrls.map((url, i) => ({ id: Date.now() + i, url, sort_order: i }))] }));
      toast.success(`${newUrls.length} image(s) uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteImage = async (imageId, productId) => {
    try {
      await api.delete(`/vendor/images/${imageId}`);
      setProductImages(prev => ({ ...prev, [productId]: prev[productId].filter(img => img.id !== imageId) }));
      toast.success('Image deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-wide">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products listed</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl font-bold tracking-wide">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <button onClick={resetForm}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required className="input-field" placeholder="e.g. TMT Steel Bar Fe500D - 10mm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <select value={form.category_id} onChange={e => setForm(p => ({...p, category_id: e.target.value}))} className="input-field">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Brand</label>
              <input value={form.brand} onChange={e => setForm(p => ({...p, brand: e.target.value}))} className="input-field" placeholder="e.g. TATA, JSW, ACC" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description / Specifications</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} className="input-field resize-none" placeholder="Grade, size, specifications, usage..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Price (₹)</label>
              <input type="number" value={form.price_min} onChange={e => setForm(p => ({...p, price_min: e.target.value}))} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Max Price (₹)</label>
              <input type="number" value={form.price_max} onChange={e => setForm(p => ({...p, price_max: e.target.value}))} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Price Per Unit</label>
              <select value={form.price_unit} onChange={e => setForm(p => ({...p, price_unit: e.target.value}))} className="input-field">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Order Qty</label>
              <div className="flex gap-2">
                <input type="number" value={form.min_order_quantity} onChange={e => setForm(p => ({...p, min_order_quantity: e.target.value}))} className="input-field flex-1" placeholder="1" />
                <select value={form.min_order_unit} onChange={e => setForm(p => ({...p, min_order_unit: e.target.value}))} className="input-field w-28">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU / Product Code</label>
              <input value={form.sku} onChange={e => setForm(p => ({...p, sku: e.target.value}))} className="input-field" placeholder="Optional" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Available for Sale</label>
              <button type="button" onClick={() => setForm(p => ({...p, is_available: !p.is_available}))}
                className={`w-12 h-6 rounded-full transition-colors ${form.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${form.is_available ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editProduct ? 'Save Changes' : 'Add Product'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Product list */}
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : products.length === 0 ? <EmptyState icon="📦" title="No Products Yet" description="Add your first construction material product." action={<button onClick={() => setShowForm(true)} className="btn-primary">Add First Product</button>} />
        : (
          <div className="space-y-3">
            {products.map(product => {
              const imgs = productImages[product.id];
              const imgCount = imgs?.length || (product.images ? JSON.parse(typeof product.images === 'string' ? product.images : JSON.stringify(product.images))?.length : 0) || 0;
              return (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {product.images && JSON.parse(typeof product.images === 'string' ? product.images : '[]')[0]
                        ? <img src={JSON.parse(typeof product.images === 'string' ? product.images : '[]')[0]} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-7 h-7 text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        {!product.is_available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Hidden</span>}
                        {product.brand && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{product.brand}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{product.category_name} {product.sku && `· SKU: ${product.sku}`}</div>
                      {(product.price_min || product.price_max) && (
                        <div className="text-sm font-bold text-brand-600 mt-1">
                          ₹{product.price_min}{product.price_max && product.price_max !== product.price_min ? ` - ₹${product.price_max}` : ''} per {product.price_unit}
                          {product.min_order_quantity && <span className="text-gray-400 font-normal ml-2 text-xs">Min: {product.min_order_quantity} {product.min_order_unit}</span>}
                        </div>
                      )}
                      {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openImageModal(product.id)}
                        className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <Image className="w-3.5 h-3.5" />
                        Images {imgCount > 0 ? `(${imgCount})` : ''}
                      </button>
                      <button onClick={() => handleToggleAvailable(product)} className={`p-1.5 rounded-lg transition-colors ${product.is_available ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`} title={product.is_available ? 'Hide' : 'Show'}>
                        {product.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Image upload modal */}
      {imageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setImageModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold tracking-wide">Product Images</h3>
              <button onClick={() => setImageModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5">
              {/* Image grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(productImages[imageModal] || []).map(img => (
                  <div key={img.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => handleDeleteImage(img.id, imageModal)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Upload button */}
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-brand-400 hover:bg-brand-50 transition-colors group">
                  {uploading ? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" /> : <><Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-500 mb-1" /><span className="text-xs text-gray-400 group-hover:text-brand-500">Add Image</span></>}
                </button>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-xs text-gray-500 text-center">Upload up to {5} images. Max 5MB each. JPG, PNG, WebP supported.</p>
              <p className="text-xs text-amber-600 text-center mt-1">💡 Upgrade your plan to upload more images per product.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
