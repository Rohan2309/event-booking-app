const Category = require("../models/Category");
const Joi = require("joi");
const slugify = require("slugify");

class CategoryController {

  // ====================================
  // LIST ALL CATEGORIES
  // ====================================
  static async list(req, res) {
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

  // ====================================
  // SHOW CREATE CATEGORY PAGE
  // ====================================
  static showCreate(req, res) {
    res.render("admin/createCategory", {
      success: req.flash("success"),
      error: req.flash("error")
    });
  }

  // ====================================
  // CREATE CATEGORY
  // ====================================
  static async create(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().min(2).required()
      });

      const { error, value } = schema.validate(req.body);

      if (error) {
        req.flash("error", error.message);
        return res.redirect("/admin/categories/create");
      }

      const categoryName = value.name.trim();

      const exists = await Category.findOne({ name: categoryName });
      if (exists) {
        req.flash("error", "Category already exists");
        return res.redirect("/admin/categories/create");
      }

      const category = new Category({
        name: categoryName,
        slug: slugify(categoryName, { lower: true, strict: true })
      });

      await category.save();

      req.flash("success", "Category created successfully");
      return res.redirect("/admin/categories");

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to create category");
      return res.redirect("/admin/categories/create");
    }
  }
  static async showEdit(req, res) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/categories");
    }

    res.render("admin/editCategory", {
      category,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot load category");
    return res.redirect("/admin/categories");
  }
}
static async update(req, res) {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      req.flash("error", error.message);
      return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }

    const newName = value.name.trim();

    // Check duplicate
    const exists = await Category.findOne({ 
      name: newName, 
      _id: { $ne: req.params.id } 
    });

    if (exists) {
      req.flash("error", "Another category with this name already exists");
      return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }

    await Category.findByIdAndUpdate(req.params.id, {
      name: newName,
      slug: slugify(newName, { lower: true, strict: true })
    });

    req.flash("success", "Category updated successfully");
    return res.redirect("/admin/categories");

  } catch (err) {
    console.error(err);
    req.flash("error", "Update failed");
    return res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
}

  // ====================================
  // DELETE CATEGORY
  // ====================================
  static async delete(req, res) {
    try {
      const id = req.params.id;

      // OPTIONAL: Block delete if category has events
      // const eventCount = await Event.countDocuments({ category: id });
      // if (eventCount > 0) {
      //   req.flash("error", "Cannot delete — category contains events");
      //   return res.redirect("/admin/categories");
      // }

      await Category.findByIdAndDelete(id);

      req.flash("success", "Category deleted successfully");
      res.redirect("/admin/categories");

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to delete category");
      res.redirect("/admin/categories");
    }
  }

}

module.exports = CategoryController;
