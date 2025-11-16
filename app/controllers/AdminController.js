const Category = require("../models/Category");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");

class AdminController {

  // -------------------------------------------
  // ADMIN DASHBOARD
  // -------------------------------------------
  static async dashboard(req, res) {
    try {
      const totalEvents = await Event.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const totalUsers = await User.countDocuments();

      res.render("admin/dashboard", {
        totalEvents,
        totalBookings,
        totalUsers,
        success: req.flash("success"),
        error: req.flash("error")
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Dashboard error");
      res.redirect("/admin");
    }
  }

  // -------------------------------------------
  // LIST CATEGORIES
  // -------------------------------------------
  static async categoriesPage(req, res) {
    try {
      const categories = await Category.find().sort({ name: 1 });

      res.render("admin/categories", {
        categories,
        success: req.flash("success"),
        error: req.flash("error")
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load categories");
      res.redirect("/admin");
    }
  }

  // -------------------------------------------
  // CREATE CATEGORY (simple version)
  // -------------------------------------------
  static async createCategory(req, res) {
    try {
      const { name } = req.body;

      if (!name || name.trim() === "") {
        req.flash("error", "Category name is required");
        return res.redirect("/admin/categories");
      }

      const exists = await Category.findOne({ name: name.trim() });
      if (exists) {
        req.flash("error", "Category already exists");
        return res.redirect("/admin/categories");
      }

      await Category.create({ name: name.trim() });

      req.flash("success", "Category created successfully");
      res.redirect("/admin/categories");

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to create category");
      res.redirect("/admin/categories");
    }
  }

  // -------------------------------------------
  // VIEW ALL USERS
  // -------------------------------------------
  static async usersPage(req, res) {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      res.render("admin/users", {
        users,
        success: req.flash("success"),
        error: req.flash("error")
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load users");
      res.redirect("/admin");
    }
  }

  // -------------------------------------------
  // REPORTS PAGE (Bookings + Revenue)
  // -------------------------------------------
  static async reportsPage(req, res) {
  try {
    // BOOKINGS PER EVENT WITH USER LIST
    const bookingsPerEvent = await Booking.aggregate([
      {
        $group: {
          _id: "$event",
          totalBookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" }
    ]);

    // FETCH BOOKINGS WITH USER DETAILS (for list)
    const eventBookings = await Booking.find()
      .populate("event")
      .populate("user")
      .sort({ createdAt: -1 });

    // REVENUE BY CATEGORY (only confirmed)
    const revenuePerCategory = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventData"
        }
      },
      { $unwind: "$eventData" },
      {
        $lookup: {
          from: "categories",
          localField: "eventData.category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$categoryData",
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.render("admin/reports", {
      bookingsPerEvent,
      eventBookings,      // NEW
      revenuePerCategory  // FIXED
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load reports");
    res.redirect("/admin");
  }
}

}

module.exports = AdminController;
