const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('express-flash');
const mongoose = require('mongoose');
require('dotenv').config(); 

// Load the routers
const indexRouter = require('./routes/index');
const articlesRouter = require('./routes/articles');
const apiArticlesRouter = require('./routes/api/articles');

console.log("Listening on port " + process.env.PORT);

// Instantiate an express app object. 
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Chain Express and 3rd Party middleware layers to the app.
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: process.env.SECRET, saveUninitialized: true, resave: false }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// Router middleware
app.use('/', indexRouter);
app.use('/articles', articlesRouter);
app.use('/api/articles', apiArticlesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('pages/error');
});

// Connect to the MongoDB database
mongoose.connect(
  process.env.MONGODB_URI, 
  { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, 
    useUnifiedTopology: true }
); 
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => { console.log('Connected to the Database.') });

module.exports = app;
