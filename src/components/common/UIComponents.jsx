// StarRating component
export function StarRating({ rating, size = 'sm', showCount, count }) {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map(s => (
          <svg key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showCount && <span className="text-xs text-gray-500 ml-1">({count || 0})</span>}
    </div>
  );
}

// Badge component
export function Badge({ type, children }) {
  const styles = {
    verified: 'bg-green-100 text-green-700',
    premium: 'bg-amber-100 text-amber-700',
    new: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${styles[type] || styles.default}`}>
      {children}
    </span>
  );
}

// Spinner component
export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <svg className={`${sz} animate-spin text-brand-600`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 font-display mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
