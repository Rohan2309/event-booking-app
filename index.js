require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// connect db
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true})
.then(()=> console.log('MongoDB connected'))
.catch(e=> console.error('MongoDB connection error', e.message));

// view engine
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'app','views'));

app.use(express.static(path.join(__dirname,'public')));
app.use('/uploads', express.static(path.join(__dirname,'public','uploads')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,      // IMPORTANT FOR LOCALHOST
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24   // 1 day
  }
}));

app.use(flash());

// custom locals middleware
app.use((req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// routes
const ejsRoutes = require('./app/routes/ejsRoutes');
const apiRoutes = require('./app/routes/apiRoutes');
app.use('/', ejsRoutes);
app.use('/api', apiRoutes);

// swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerSpec = YAML.load(path.join(__dirname,'swagger','swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, ()=> console.log('Server started on', PORT));
