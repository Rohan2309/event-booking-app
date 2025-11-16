const Event = require("../models/Event");
const Category = require("../models/Category");
const slugify = require("slugify");

class EventController {

  // Landing Page (Home)
  static async landing(req, res) {
    const events = await Event.find().populate("category");
    res.render("index", { events });
  }

  // ---------------- ADMIN LIST ----------------
  static async listAdmin(req, res) {
    try {
      const events = await Event.find()
        .populate("category")
        .sort({ createdAt: -1 });

      res.render("admin/events", {
        events,
        success: req.flash("success"),
        error: req.flash("error")
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load events");
      res.redirect("/admin");
    }
  }

  // ---------------- SHOW CREATE PAGE ----------------
  static async showCreate(req, res) {
    const categories = await Category.find();
    res.render("admin/createEvent", {
      categories,
      success: req.flash("success"),
      error: req.flash("error")
    });
  }

  // ---------------- CREATE EVENT ----------------
  static async create(req, res) {
    try {
      const data = req.body;

      const event = new Event({
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        date: data.date,
        price: data.price,
        capacity: data.capacity,
        slug: slugify(data.title, { lower: true }),
        createdBy: req.session.user.id
      });

      if (req.file) {
        event.image = "/uploads/" + req.file.filename;
      }

      await event.save();

      req.flash("success", "Event created successfully!");
      res.redirect("/admin/events");

    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to create event");
      res.redirect("/admin/events/create");
    }
  }

  // ---------------- SHOW EDIT PAGE ----------------
  static async showEdit(req, res) {
    try {
      const event = await Event.findById(req.params.id);
      const categories = await Category.find();

      res.render("admin/editEvent", {
        event,
        categories,
        success: req.flash("success"),
        error: req.flash("error")
      });

    } catch (err) {
      console.error(err);
      req.flash("error", "Event not found");
      res.redirect("/admin/events");
    }
  }

  // ---------------- UPDATE EVENT ----------------
  static async update(req, res) {
    try {
      let updateData = { ...req.body };

      if (req.file) {
        updateData.image = "/uploads/" + req.file.filename;
      }

      updateData.slug = slugify(req.body.title, { lower: true });

      await Event.findByIdAndUpdate(req.params.id, updateData);

      req.flash("success", "Event updated successfully!");
      res.redirect("/admin/events");

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to update event");
      res.redirect("/admin/events");
    }
  }

  // ---------------- PUBLIC EVENT VIEW ----------------
  static async showEvent(req, res) {
    try {
      const event = await Event.findOne({ slug: req.params.slug }).populate("category");

      if (!event) return res.send("Event not found");

      return res.render("events/show", { event });


    } catch (err) {
      console.error(err);
      res.redirect("/");
    }
  }
}

module.exports = EventController;
