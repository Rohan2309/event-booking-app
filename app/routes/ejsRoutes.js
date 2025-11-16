const express = require('express');
const router = express.Router();

const EventController = require('../controllers/EventController');
const AuthController = require('../controllers/AuthController');
const AdminController = require('../controllers/AdminController');
const UserController = require('../controllers/UserController');
const BookingController = require('../controllers/BookingController');
const CategoryController = require("../controllers/CategoryController");

const { ensureAuth, isUser } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/role");

const multer = require('multer');

// ----------------- MULTER STORAGE -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });


// ----------------- LANDING -----------------
router.get('/', EventController.landing);


// ----------------- AUTH -----------------
router.get('/auth/register', AuthController.showRegister);
router.post('/auth/register', AuthController.register);

router.get('/auth/login', AuthController.showLogin);
router.post('/auth/login', AuthController.login);

router.get('/auth/logout', AuthController.logout);

// Forgot + OTP
router.get('/auth/forgot', AuthController.forgotPasswordPage);
router.post('/auth/forgot', AuthController.forgotPassword);

// OTP verify page (FIXED)
router.get('/auth/verify', AuthController.verifyOtpPage);
router.post('/auth/verify', AuthController.verifyOtp);


// ----------------- ADMIN -----------------
router.get('/admin', ensureAuth, isAdmin, AdminController.dashboard);

// Categories
router.get('/admin/categories', ensureAuth, isAdmin, CategoryController.list);
router.get('/admin/categories/create', ensureAuth, isAdmin, CategoryController.showCreate);
router.post('/admin/categories/create', ensureAuth, isAdmin, CategoryController.create);
router.post('/admin/categories/delete/:id', ensureAuth, isAdmin, CategoryController.delete);
router.get('/admin/categories/edit/:id', ensureAuth, isAdmin, CategoryController.showEdit);
router.post('/admin/categories/edit/:id', ensureAuth, isAdmin, CategoryController.update);

// Users
router.get('/admin/users', ensureAuth, isAdmin, AdminController.usersPage);

// Reports
router.get('/admin/reports', ensureAuth, isAdmin, AdminController.reportsPage);

// Booking Status
router.post('/admin/bookings/status/:id', ensureAuth, isAdmin, BookingController.updateStatus);

// Admin Events
router.get('/admin/events', ensureAuth, isAdmin, EventController.listAdmin);
router.get('/admin/events/create', ensureAuth, isAdmin, EventController.showCreate);
router.post('/admin/events/create', ensureAuth, isAdmin, upload.single('image'), EventController.create);
router.get('/admin/events/edit/:id', ensureAuth, isAdmin, EventController.showEdit);
router.post('/admin/events/edit/:id', ensureAuth, isAdmin, upload.single('image'), EventController.update);


// ----------------- PUBLIC EVENT DETAIL -----------------
router.get('/events/:slug', EventController.showEvent);


// ----------------- USER -----------------
router.get('/user/dashboard', ensureAuth, isUser, UserController.dashboard);

router.get('/user/profile', ensureAuth, isUser, UserController.profilePage);
router.post('/user/profile', ensureAuth, isUser, UserController.updateProfile);

router.get('/user/events', ensureAuth, isUser, UserController.eventsPage);

router.post('/user/book/:eventId', ensureAuth, isUser, UserController.bookEvent);

router.get('/user/bookings', ensureAuth, isUser, UserController.myBookings);


// ----------------- EXPORT -----------------
module.exports = router;
