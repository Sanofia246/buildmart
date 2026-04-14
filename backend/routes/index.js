const express = require('express');
const router = express.Router();
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { upload, setUploadType } = require('../middleware/upload');
const auth = require('../controllers/authController');
const supplier = require('../controllers/supplierController');
const data = require('../controllers/dataController');
const admin = require('../controllers/adminController');
const vendor = require('../controllers/vendorController');

// AUTH
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.getMe);
router.put('/auth/change-password', authenticate, auth.changePassword);

// PUBLIC
router.get('/categories', data.getCategories);
router.get('/cities', data.getCities);
router.get('/search', data.globalSearch);
router.get('/plans', admin.getPlans);
router.get('/suppliers', supplier.getSuppliers);
router.get('/suppliers/featured', supplier.getFeaturedSuppliers);
router.get('/suppliers/:slug', optionalAuth, supplier.getSupplierBySlug);
router.get('/suppliers/:supplierId/products', data.getSupplierProducts);
router.get('/suppliers/:supplierId/reviews', data.getSupplierReviews);

// VENDOR
router.get('/vendor/profile', authenticate, supplier.getMySupplierProfile);
router.post('/vendor/profile', authenticate, supplier.createSupplierProfile);
router.put('/vendor/profile', authenticate, supplier.updateSupplierProfile);
router.get('/vendor/stats', authenticate, supplier.getSupplierStats);
router.get('/vendor/plan', authenticate, vendor.getMyPlan);
router.post('/vendor/upgrade', authenticate, vendor.upgradePlan);
router.get('/vendor/inquiries', authenticate, data.getMyInquiries);
router.put('/vendor/inquiries/:id/status', authenticate, data.updateInquiryStatus);
router.post('/vendor/upload/logo', authenticate, setUploadType('logo'), upload.single('logo'), vendor.uploadLogo);
router.post('/vendor/upload/banner', authenticate, setUploadType('banner'), upload.single('banner'), vendor.uploadBanner);
router.get('/vendor/products', authenticate, data.getMyProducts);
router.post('/vendor/products', authenticate, data.createProduct);
router.put('/vendor/products/:id', authenticate, data.updateProduct);
router.delete('/vendor/products/:id', authenticate, data.deleteProduct);
router.get('/vendor/products/:productId/images', authenticate, vendor.getProductImages);
router.post('/vendor/products/:productId/images', authenticate, setUploadType('product'), upload.array('images', 10), vendor.uploadProductImages);
router.delete('/vendor/images/:imageId', authenticate, vendor.deleteProductImage);
router.get('/vendor/orders', authenticate, vendor.getVendorOrders);
router.post('/vendor/orders', optionalAuth, vendor.createOrder);
router.put('/vendor/orders/:id/status', authenticate, vendor.updateOrderStatus);

// BUYER
router.post('/inquiries', optionalAuth, data.createInquiry);
router.post('/reviews', authenticate, data.createReview);
router.get('/saved', authenticate, data.getSavedSuppliers);
router.post('/saved/:supplierId', authenticate, data.saveSupplier);
router.delete('/saved/:supplierId', authenticate, data.unsaveSupplier);

// ADMIN
router.get('/admin/dashboard', authenticate, requireRole('admin'), admin.getDashboardStats);
router.get('/admin/suppliers', authenticate, requireRole('admin'), admin.getAllSuppliers);
router.patch('/admin/suppliers/:id/verify', authenticate, requireRole('admin'), admin.toggleSupplierVerified);
router.patch('/admin/suppliers/:id/premium', authenticate, requireRole('admin'), admin.toggleSupplierPremium);
router.patch('/admin/suppliers/:id/active', authenticate, requireRole('admin'), admin.toggleSupplierActive);
router.post('/admin/suppliers/:id/plan', authenticate, requireRole('admin'), admin.assignPlan);      
router.get('/admin/users', authenticate, requireRole('admin'), admin.getAllUsers);
router.patch('/admin/users/:id/active', authenticate, requireRole('admin'), admin.toggleUserActive); 
router.get('/admin/reviews', authenticate, requireRole('admin'), admin.getAllReviews);
router.delete('/admin/reviews/:id', authenticate, requireRole('admin'), admin.deleteReview);
router.get('/admin/inquiries', authenticate, requireRole('admin'), admin.getAllInquiries);
router.get('/admin/orders', authenticate, requireRole('admin'), admin.getAllOrders);
router.post('/admin/categories', authenticate, requireRole('admin'), admin.createCategory);
router.put('/admin/categories/:id', authenticate, requireRole('admin'), admin.updateCategory);       
router.get('/admin/plans', authenticate, requireRole('admin'), admin.getPlans);
router.put('/admin/plans/:id', authenticate, requireRole('admin'), admin.updatePlan);

// Legacy
router.get('/suppliers/me', authenticate, supplier.getMySupplierProfile);
router.post('/suppliers', authenticate, supplier.createSupplierProfile);
router.put('/suppliers/me', authenticate, supplier.updateSupplierProfile);
router.get('/products/me', authenticate, data.getMyProducts);
router.post('/products', authenticate, data.createProduct);
router.put('/products/:id', authenticate, data.updateProduct);
router.delete('/products/:id', authenticate, data.deleteProduct);
router.get('/inquiries/me', authenticate, data.getMyInquiries);
router.put('/inquiries/:id/status', authenticate, data.updateInquiryStatus);

module.exports = router;
