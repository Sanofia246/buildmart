import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const categories = [
  { name: 'Cement & Concrete', slug: 'cement-concrete' },
  { name: 'Steel & Iron', slug: 'steel-iron' },
  { name: 'Bricks & Blocks', slug: 'bricks-blocks' },
  { name: 'Sand & Aggregates', slug: 'sand-aggregates' },
  { name: 'Tiles & Flooring', slug: 'tiles-flooring' },
  { name: 'Pipes & Plumbing', slug: 'pipes-plumbing' },
];

const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Vellore'];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-brand-600 rounded-lg p-1.5">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-extrabold text-white tracking-wide">
                BUILD<span className="text-brand-400">MART</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Tamil Nadu's most trusted platform for construction raw material suppliers. Connecting builders with verified suppliers across all 38 districts.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-600 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-display text-lg font-bold mb-4 tracking-wide">Material Categories</h4>
            <ul className="space-y-2.5">
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`} className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-white font-display text-lg font-bold mb-4 tracking-wide">Top Cities</h4>
            <ul className="space-y-2.5">
              {cities.map(city => (
                <li key={city}>
                  <Link to={`/suppliers?city=${city}`} className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                    Suppliers in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-display text-lg font-bold mb-4 tracking-wide">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                <span className="text-gray-400">Anna Salai, Chennai - 600002, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="tel:+919999999999" className="text-gray-400 hover:text-white transition-colors">+91 99999 99999</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="mailto:info@buildmart.in" className="text-gray-400 hover:text-white transition-colors">info@buildmart.in</a>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded-xl">
              <p className="text-sm font-semibold text-white mb-1">List Your Business</p>
              <p className="text-xs text-gray-400 mb-3">Reach thousands of buyers across Tamil Nadu</p>
              <Link to="/register-supplier" className="block text-center bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">© 2024 BuildMart. All rights reserved. Made with ❤️ for Tamil Nadu builders.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
