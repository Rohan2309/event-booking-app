const User = require('../models/User');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

class AuthController {

  static showRegister(req, res) {
    res.render('auth/register', {
      error: req.flash("error"),
      success: req.flash("success")
    });
  }

  static async register(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("admin", "user").required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        req.flash("error", error.message);
        return res.redirect("/auth/register");
      }

      const exists = await User.findOne({ email: value.email });
      if (exists) {
        req.flash("error", "Email already exists");
        return res.redirect("/auth/register");
      }

      const user = new User(value);
      await user.save();

      req.flash("success", "Registered successfully. Please log in.");
      return res.redirect("/auth/login");

    } catch (err) {
      console.error(err);
      req.flash("error", "Registration failed");
      return res.redirect("/auth/register");
    }
  }

  static showLogin(req, res) {
    res.render("auth/login", {
      error: req.flash("error"),
      success: req.flash("success")
    });
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "Invalid credentials");
        return res.redirect("/auth/login");
      }

      const ok = await user.comparePassword(password);
      if (!ok) {
        req.flash("error", "Invalid credentials");
        return res.redirect("/auth/login");
      }

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id, rid: crypto.randomBytes(8).toString("hex") },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      user.refreshToken = refreshToken;
      await user.save();

      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;

      req.flash("success", "Logged in successfully");

      return user.role === "admin"
        ? res.redirect("/admin")
        : res.redirect("/user/dashboard");

    } catch (err) {
      console.error(err);
      req.flash("error", "Login failed");
      return res.redirect("/auth/login");
    }
  }

  static logout(req, res) {
    try {
      if (req.session?.user?.id) {
        User.findByIdAndUpdate(req.session.user.id, {
          $unset: { refreshToken: 1 }
        }).catch(() => {});
      }
    } catch (e) {}

    req.session.destroy(() => res.redirect("/"));
  }

  static forgotPasswordPage(req, res) {
    res.render("auth/forgot", {
      error: req.flash("error"),
      success: req.flash("success")
    });
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        req.flash("success", "If the email exists, an OTP was sent.");
        return res.redirect("/auth/forgot");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.resetOTP = otp;
      user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendMail({
        to: user.email,
        subject: "Password Reset OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`
      });

      req.flash("success", "OTP sent successfully.");
      return res.redirect(`/auth/verify?email=${email}`);

    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to send OTP");
      return res.redirect("/auth/forgot");
    }
  }

  static verifyOtpPage(req, res) {
    res.render("auth/verifyOtp", {
      email: req.query.email || "",
      error: req.flash("error"),
      success: req.flash("success")
    });
  }

  static async verifyOtp(req, res) {
    try {
      const { email, otp, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect(`/auth/verify?email=${email}`);
      }

      if (!user.resetOTP || user.resetOTP !== otp || user.resetOTPExpire < Date.now()) {
        req.flash("error", "Invalid or expired OTP");
        return res.redirect(`/auth/verify?email=${email}`);
      }

      user.password = password;
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      await user.save();

      req.flash("success", "Password updated successfully! Please log in.");
      return res.redirect("/auth/login");

    } catch (err) {
      console.error(err);
      req.flash("error", "Something went wrong");
      return res.redirect(`/auth/verify?email=${email}`);
    }
  }

}

module.exports = AuthController;
