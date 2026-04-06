import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ReviewForm({ supplierId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    setLoading(true);
    try {
      await api.post('/reviews', { supplier_id: supplierId, rating, title, comment });
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
    setLoading(false);
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold tracking-wide">Write a Review</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center">
            <label className="text-xs font-semibold text-gray-500 mb-3 block">Your Rating *</label>
            <div className="flex justify-center gap-2 mb-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110">
                  <Star className={`w-9 h-9 ${s <= (hover || rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} transition-colors`} />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && <p className="text-sm font-semibold text-amber-500">{labels[hover || rating]}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Review Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input-field text-sm py-2.5" placeholder="Summarize your experience" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Review</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} className="input-field text-sm py-2.5 resize-none"
              placeholder="Share your experience with product quality, delivery, customer service..." />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
