const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.ensureAuth = async (req,res,next)=>{
  try{
    if(req.session && req.session.user) return next();
    // fallback: check Authorization header
    const auth = req.headers.authorization;
    if(auth && auth.startsWith('Bearer ')){
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if(user){ req.session.user = user; return next(); }
    }
    req.flash('error','Please login');
    return res.redirect('/auth/login');
  }catch(e){
    req.flash('error','Auth error');
    return res.redirect('/auth/login');
  }
};
exports.isUser = (req, res, next) => {
  if (req.session?.user?.role === "user") return next();
  req.flash("error", "Access denied");
  return res.redirect("/");
};
