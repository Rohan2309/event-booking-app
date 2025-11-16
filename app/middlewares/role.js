exports.isAdmin = (req,res,next)=>{
  const user = req.session.user;
  if(user && user.role === 'admin') return next();
  req.flash('error','Admin access required');
  return res.redirect('/');
};
