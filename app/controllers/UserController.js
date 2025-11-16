const User = require("../models/User");
const Event = require("../models/Event");
const Category = require("../models/Category");
const Booking = require("../models/Booking");
const { sendMail } = require("../utils/mailer");

class UserController {

  // ---------------- USER DASHBOARD ----------------
  static async dashboard(req, res) {
    res.render("user/dashboard", {
      success: req.flash("success"),
      error: req.flash("error"),
      user: req.session.user
    });
  }

  // ---------------- PROFILE PAGE ----------------
  static async profilePage(req, res) {
    try {
      const user = await User.findById(req.session.user.id);
      res.render("user/profile", {
        user,
        success: req.flash("success"),
        error: req.flash("error")
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load profile");
      res.redirect("/user/dashboard");
    }
  }

  // ---------------- UPDATE PROFILE ----------------
  static async updateProfile(req, res) {
    try {
      const user = await User.findById(req.session.user.id);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/user/profile");
      }

      user.name = req.body.name || user.name;
      await user.save();
      req.session.user.name = user.name;

      req.flash("success", "Profile updated");
      res.redirect("/user/profile");

    } catch (err) {
      console.error(err);
      req.flash("error", "Profile update failed");
      res.redirect("/user/profile");
    }
  }

  // ---------------- EVENTS LISTING ----------------
  static async eventsPage(req, res) {
    try {
      const { category, search, sort } = req.query;

      let filter = {};

      if (category && category !== "all") {
        filter.category = category;
      }

      if (search) {
        filter.title = { $regex: search, $options: "i" };
      }

      let sortOption = {};
      if (sort === "price_asc") sortOption.price = 1;
      if (sort === "price_desc") sortOption.price = -1;

      const categories = await Category.find();
      const events = await Event.find(filter)
        .populate("category")
        .sort(sortOption);

      res.render("user/events", {
        categories,
        events,
        selectedCategory: category || "all",
        searchQuery: search || "",
        sort,
        user: req.session.user
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load events");
      res.redirect("/user/dashboard");
    }
  }

  // ---------------- BOOK EVENT ----------------
static async bookEvent(req, res) {
  try {
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/user/events");
    }

    // Correct price calculation
    const totalAmount = event.price * 1; // 1 ticket mock

    const booking = new Booking({
      user: req.session.user.id,
      event: eventId,
      tickets: 1,
      totalAmount: totalAmount,  // ✅ FIXED field name
      status: "pending"
    });

    await booking.save();

    // Email user
    await sendMail({
      to: req.session.user.email,
      subject: "Booking Created",
      text: `Your booking for ${event.title} is pending admin approval.`
    });

    req.flash("success", "Booking created and is pending approval.");
    res.redirect("/user/bookings");

  } catch (err) {
    console.error(err);
    req.flash("error", "Booking failed");
    res.redirect("/user/events");
  }
}


  // ---------------- MY BOOKINGS ----------------
  static async myBookings(req, res) {
    try {
      const bookings = await Booking.find({ user: req.session.user.id })
        .populate("event");

      res.render("user/myBookings", {
        bookings,
        user: req.session.user
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load bookings");
      res.redirect("/user/dashboard");
    }
  }
}

module.exports = UserController;
