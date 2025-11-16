const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Category = require('../models/Category');
const User = require('../models/User');

/*  
─────────────────────────────────────
   REMOVE INVALID AUTH ROUTES
   (apiRegister, apiLogin, refreshToken, apiLogout DO NOT EXIST)
─────────────────────────────────────
*/


// ---------------- EVENTS LIST ----------------
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const q = req.query.q || '';
    const category = req.query.category || '';
    const sort = req.query.sort || 'date';

    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (category) filter.category = category;

    const total = await Event.countDocuments(filter);

    const events = await Event.find(filter)
      .populate('category')
      .sort({ [sort]: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ events, meta: { page, limit, total } });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});


// ---------------- ADMIN CHECK ----------------
const requireAdmin = async (req, res, next) => {
  const token =
    req.headers['x-admin-token'] ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) return res.status(401).json({ error: 'Admin token required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });

    req.user = user;
    next();

  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};


// ---------------- ADMIN EVENT CRUD ----------------
router.post('/events', requireAdmin, async (req, res) => {
  try {
    const ev = new Event(req.body);
    await ev.save();
    res.json({ event: ev });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/events/:id', requireAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ event: ev });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});


// ---------------- USER AUTH CHECK FOR BOOKINGS ----------------
const requireAuthApi = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token' });

  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.id);

    if (!user) return res.status(401).json({ error: 'No user' });

    req.user = user;
    next();

  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: 'Invalid token' });
  }
};


// ---------------- BOOK EVENT ----------------
router.post('/bookings/:eventId', requireAuthApi, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const tickets = parseInt(req.body.tickets || 1);
    if (tickets > ev.capacity)
      return res.status(400).json({ error: 'Not enough capacity' });

    const total = tickets * ev.price;

    const booking = await Booking.create({
      user: req.user._id,
      event: ev._id,
      tickets,
      totalAmount: total,
      status: 'confirmed'
    });

    const payment = await Payment.create({
      booking: booking._id,
      amount: total,
      method: req.body.method || 'mock',
      status: 'completed',
      txRef: 'MOCK' + Date.now()
    });

    ev.capacity = Math.max(0, ev.capacity - tickets);
    await ev.save();

    res.json({ booking, payment });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});


// ---------------- CANCEL BOOKING ----------------
router.post('/bookings/:id/cancel', requireAuthApi, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking)
      return res.status(404).json({ error: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not allowed' });

    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Already cancelled' });

    booking.status = 'cancelled';
    await booking.save();

    await Payment.findOneAndUpdate(
      { booking: booking._id },
      { status: 'failed' }
    );

    const ev = await Event.findById(booking.event._id);
    ev.capacity += booking.tickets;
    await ev.save();

    res.json({ message: 'Cancelled', booking });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});


// ---------------- REPORTS ----------------
router.get('/admin/reports/bookings-per-event', requireAdmin, async (req, res) => {
  try {
    const agg = await Booking.aggregate([
      { $group: { _id: "$event", count: { $sum: 1 }, tickets: { $sum: "$tickets" }, revenue: { $sum: "$totalAmount" } } },
      { $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "event" } },
      { $unwind: "$event" },
      { $project: { eventTitle: "$event.title", tickets: 1, revenue: 1, count: 1 } },
      { $sort: { revenue: -1 } }
    ]);

    res.json({ data: agg });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});


router.get('/admin/reports/revenue-per-category', requireAdmin, async (req, res) => {
  try {
    const agg = await Booking.aggregate([
      { $lookup: { from: "events", localField: "event", foreignField: "_id", as: "event" } },
      { $unwind: "$event" },
      { $group: { _id: "$event.category", revenue: { $sum: "$totalAmount" }, tickets: { $sum: "$tickets" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $project: { category: "$category.name", revenue: 1, tickets: 1 } },
      { $sort: { revenue: -1 } }
    ]);

    res.json({ data: agg });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});


module.exports = router;
