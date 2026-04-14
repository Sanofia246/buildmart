# 🏗️ BuildMart — Construction Supplier Platform for Tamil Nadu

> Tamil Nadu's #1 directory for construction raw material suppliers — built like IndiaMart/JustDial but focused entirely on the construction industry.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Fonts | Barlow Condensed + DM Sans |

---

## 📦 Features

### For Buyers
- 🔍 Search suppliers by material type, city, district
- 🗂️ Browse by 12 material categories (Cement, Steel, Sand, Tiles, etc.)
- ⭐ Read and write verified reviews
- 📩 Send inquiry forms directly to suppliers
- ❤️ Save/shortlist suppliers
- 🏆 Filter by verified, premium, rating, and more

### For Suppliers
- 🏭 Multi-step business registration wizard
- 📋 Dashboard with stats (views, inquiries, rating)
- 📦 Product listing with price ranges
- 📬 Manage incoming buyer inquiries
- ✅ Verification badge system

### Platform
- 🔐 JWT-based authentication
- 🌐 Full search with autocomplete
- 📱 Fully responsive mobile design
- 🗺️ District-level filtering (all 38 Tamil Nadu districts)
- 📊 Admin panel ready (role-based)

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

---

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE buildmart;"

# Run schema (creates all tables + seeds categories)
psql -U postgres -d buildmart -f backend/config/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL, JWT_SECRET

# Start development server
npm run dev
```

The backend runs on: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on: **http://localhost:5173**

> The Vite dev server proxies `/api/*` requests to `http://localhost:5000` automatically.

---

## 🔑 Default Admin Account

After running the schema, a default admin account is created:

- **Email:** admin@buildmart.in
- **Password:** Admin@123

> ⚠️ Change this password immediately in production!

---

## 📁 Project Structure

```
buildmart/
├── backend/
│   ├── config/
│   │   ├── database.js        # PostgreSQL connection pool
│   │   └── schema.sql         # Full DB schema + seeds
│   ├── controllers/
│   │   ├── authController.js      # Register, login, me
│   │   ├── supplierController.js  # Supplier CRUD + stats
│   │   └── dataController.js      # Products, reviews, inquiries
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   └── index.js           # All API routes
│   ├── server.js              # Express app entry point
│   ├── .env.example           # Environment variables template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/        # Navbar, Footer, Cards, UI
    │   │   └── suppliers/     # InquiryModal, ReviewForm
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── SuppliersPage.jsx    # With full filter sidebar
    │   │   ├── SupplierDetailPage.jsx
    │   │   ├── DashboardPage.jsx    # Full supplier dashboard
    │   │   ├── RegisterSupplierPage.jsx  # Multi-step wizard
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── CategoryPage.jsx
    │   ├── utils/
    │   │   └── api.js         # Axios instance with auth
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Suppliers
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/suppliers | List all (with filters) |
| GET | /api/suppliers/featured | Premium suppliers |
| GET | /api/suppliers/:slug | Supplier detail |
| POST | /api/suppliers | Create profile |
| PUT | /api/suppliers/me | Update profile |
| GET | /api/suppliers/me/stats | Dashboard stats |

### Products, Reviews, Inquiries
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/products/me | My products |
| POST | /api/products | Add product |
| DELETE | /api/products/:id | Delete product |
| POST | /api/reviews | Submit review |
| POST | /api/inquiries | Send inquiry |
| GET | /api/inquiries/me | My inquiries |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/categories | All categories |
| GET | /api/cities | Popular cities |
| GET | /api/search?q= | Global search |
| GET/POST/DELETE | /api/saved/:id | Save/unsave suppliers |

---

## 🚀 Production Deployment

### Backend
- Set `NODE_ENV=production` in `.env`
- Use a managed PostgreSQL (e.g., Supabase, Neon, Railway)
- Deploy on Railway, Render, or a VPS

### Frontend
```bash
cd frontend
npm run build
# Deploy the /dist folder to Netlify, Vercel, or serve via Nginx
```

---

## 🛠️ Extending the Platform

- **Image uploads**: Add Multer + Cloudinary/S3 for logo/banner uploads
- **Maps**: Integrate Leaflet.js or Google Maps for supplier location
- **OTP**: Add Twilio/MSG91 for phone verification
- **Payments**: Razorpay for premium listing subscriptions
- **Admin panel**: Build at `/admin` using the existing role system

---

## 📄 License

MIT — Free to use, modify and deploy.

Made with ❤️ for Tamil Nadu's construction industry.
