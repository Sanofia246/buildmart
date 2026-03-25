import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, Star, MessageSquare, Heart, Award } from 'lucide-react';
import { StarRating } from './UIComponents';

export default function SupplierCard({ supplier, onSave, saved }) {
  const initials = supplier.business_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="card overflow-hidden group hover:-translate-y-0.5 transition-all duration-200">
      {/* Banner / Header */}
      <div className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {supplier.banner_url ? (
          <img src={supplier.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-4 text-6xl">🏗️</div>
          </div>
        )}
        {supplier.is_premium && (
          <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" /> PREMIUM
          </div>
        )}
        {onSave && (
          <button onClick={(e) => { e.preventDefault(); onSave(supplier.id); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${saved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:text-red-500'}`}>
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Logo + Name row */}
        <div className="flex items-start gap-3 -mt-8 mb-3">
          <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-brand-600 flex items-center justify-center text-white font-display text-xl font-bold shrink-0">
            {supplier.logo_url ? (
              <img src={supplier.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : initials}
          </div>
          <div className="pt-6 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display text-base font-bold text-gray-900 leading-tight truncate">
                {supplier.business_name}
              </h3>
              {supplier.is_verified && (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" title="Verified" />
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{[supplier.city, supplier.district].filter(Boolean).join(', ') || 'Tamil Nadu'}</span>
        </div>

        {/* Description */}
        {supplier.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{supplier.description}</p>
        )}

        {/* Categories */}
        {supplier.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.categories.filter(Boolean).slice(0, 3).map((cat, i) => (
              <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{cat}</span>
            ))}
            {supplier.categories.filter(Boolean).length > 3 && (
              <span className="text-xs text-gray-400">+{supplier.categories.filter(Boolean).length - 3} more</span>
            )}
          </div>
        )}

        {/* Rating + Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <StarRating rating={supplier.average_rating || 0} />
            <span className="text-xs font-semibold text-gray-700">{parseFloat(supplier.average_rating || 0).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({supplier.total_reviews || 0})</span>
          </div>
          <Link to={`/suppliers/${supplier.slug}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:gap-2 transition-all">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
