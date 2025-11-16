const Booking = require("../models/Booking");
const Event = require("../models/Event");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");

class BookingController {

  // ---------------- ADMIN UPDATE STATUS ----------------
  static async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const bookingId = req.params.id;

      const booking = await Booking.findById(bookingId)
        .populate("user")
        .populate("event");

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/admin/reports");
      }

      // Update booking status
      booking.status = status;
      await booking.save();

      // Email Notification
      await sendMail({
        to: booking.user.email,
        subject: "Booking Status Update",
        text: `Hello ${booking.user.name},\n\nYour booking for "${booking.event.title}" is now: ${status.toUpperCase()}.\n\nThank you for using EventBook!`
      });

      req.flash("success", "Booking status updated!");
      return res.redirect("/admin/reports");

    } catch (err) {
      console.error("Update Status Error:", err);
      req.flash("error", "Failed to update booking status");
      return res.redirect("/admin/reports");
    }
  }

}

module.exports = BookingController;
