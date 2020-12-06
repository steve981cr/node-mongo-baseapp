const express = require('express');
const router = express.Router();
const User = require('../models/user');
const createError = require('http-errors');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');
const sgMail = require('@sendgrid/mail');
const ejs = require('ejs');

// Auth routes
router.get('/signup', signupForm);
router.post('/signup', validateSignup(), signup);
router.get('/activate-account', activateAccount);
router.get('/login', loginForm);
router.post('/login', validateLogin(), login);
router.get('/logout', logout);
router.get('/forgot-password', forgotPasswordForm);
router.post('/forgot-password', validateForgotPw(), forgotPassword);
router.get('/reset-password', resetPasswordForm);
router.post('/reset-password', validateResetPw(), resetPassword);

/* TEST AUTH MIDDLEWARE */
const auth = require('./authMiddleware');
router.get('/testaccess', auth.isLoggedIn, (req, res) => res.send('Accessed Approved'));
// Go to http://localhost:3000/auth/testaccess

/* SIGNUP */

// Users Controller Function Placeholders
// GET /auth/signup
function signupForm(req, res, next) {
  res.render('auth/signup', { title: 'Signup' })
}
// POST /signup
/* // Version 1) Before adding account activation step.
async function signup(req, res, next) {
  // Limit which fields can be entered. Exclude password for now.
  const formData = { username, email } = req.body;  
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { title: 'Signup', user: formData, errors: errors.array() });
  }
  try {
    // Encrypt the password for security
    formData.password = await bcrypt.hash(req.body.password, 10);
    formData.activated = true; // No separate activation step
    const user = await User.create(formData);
    // On success - login user and redirect.
    const token = jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
    req.flash('success', 'Account Created.');
    res.redirect(`/users/${user._id}`);
  } catch (err) {
    next(err);
  }
}
*/
// Version 2) With account activation step.
async function signup(req, res, next) {
  // Limit which fields can be entered. Exclude password for now.
  const formData = { username, email } = req.body;  
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { title: 'Signup', user: formData, errors: errors.array() });
  }
  try {
    // Encrypt the password for security
    formData.password = await bcrypt.hash(req.body.password, 10);
    // Generate an activation token to save to the DB.
    formData.activationToken = await cryptoRandomString({length: 10, type: 'url-safe'});
    const user = await User.create(formData);
    // On success - send activation email.
    sendActivationEmail(user.username, user.email, user.activationToken);
    req.flash('info', 'Please check your email to activate your account.');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
}
// Helper function for signup action
async function sendActivationEmail(username, email, token) {
  const html = await ejs.renderFile(
    __dirname + "/../views/email/activate-account.ejs",
    {username: username, email: email, token: token }
  );
  const msg = {
    to: email,
    from: 'no-reply@example.com',
    subject: 'Account activation',
    html: html
  };
  try {
    // View email in the console without sending it.
    console.log('Activation Email: ', msg); 
    // Uncomment below to send the email.
    /*sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(msg);
    console.log('Email has been sent!');*/
  } catch(err) {
    console.log('There was an error sending the email. Error: ' + err);
  }
};

// GET /auth/activate-account
async function activateAccount(req, res, next) {
  if (!req.query.token || !req.query.email) {
    req.flash('warning', 'Token or email was not provided.');
    return res.redirect('/');
  }
  const user = await User.findOne({ email: req.query.email }).exec(); 
  if (!user || user.activationToken !== req.query.token) {
    req.flash('warning', 'Could not activate account.');
    return res.redirect('/');
  } 
  try {
    await User.findByIdAndUpdate(user._id, {activated: true});
    // On success - login user and redirect.
    const token = jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    req.flash('success', 'Your account is activated.');
    res.redirect(`/users/${user.id}`);
  } catch (err) {
    next(err); 
  }
};

// Form Validator & Sanitizer Middleware
function validateSignup() {
  return [
    // validate username not empty.
    body('username').trim().not().isEmpty().withMessage('Username cannot be blank.'),
    // change email to lowercase, validate not empty, valid format, not in use.
    body('email')
      .not().isEmpty().withMessage('Email cannot be blank.')
      .isEmail().withMessage('Email format is invalid.')
      .normalizeEmail()
      .custom(async (value) => {
        const user = await User.findOne({where: {email: value}}).exec();
        if (user) {
          return Promise.reject('Email is already in use');
        }
      }),
    // Validate password at least 6 chars, passwordConfirmation matches password.
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
      .custom((value, { req }) => {
        if (value !== req.body.passwordConfirmation) {
          throw new Error('Password confirmation does not match password');
        }
        // Indicates the success of this synchronous custom validator
        return true;    
      }
    )  
  ];
}

/* LOGIN/LOGOUT */

// GET /auth/login
function loginForm(req, res, next) {       
  res.render('auth/login', { title: "Log In" });
}

// POST /auth/login
async function login(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/login', { user: {email: req.body.email}, errors: errors.array() });
  }
  try {
    const user = await User.findOne({email: req.body.email}).exec();
    // the jwt and cookie each have their own expirations.
    if (user.role == null) user.role = "standard";
    const token = jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    // Assign the jwt to the cookie. 
    // Adding option secure: true only allows https. 
    // maxAge 3600000 is 1 hr (in milliseconds). Below is 1 year.
    res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
    req.flash('success', 'You are logged in.');
    res.redirect('/');    
  } catch (err) {
    next(err); 
  }
}

// GET /auth/logout
function logout(req, res, next) {
  res.clearCookie('jwt');
  req.flash('info', 'Logged out.');
  res.redirect('/');
}

function validateLogin() { return [
  body('password')
    .not().isEmpty().withMessage('Password cannot be blank.'),
  body('email')
  .not().isEmpty().withMessage('Email cannot be blank.')
  // change email to lowercase.  
  .normalizeEmail()
  // custom validator gets user object from DB from email, rejects if not present, compares user.password to hashed password from login.
  .custom(async (value, {req}) => {
    const user = await User.findOne({email: value}).exec();
    if (!user) {
      return Promise.reject('Email or Password are incorrect.');
    }
    const passwordIsValid = await bcrypt.compare(req.body.password, user.password);
    if (!passwordIsValid) {
      return Promise.reject('Email or Password are incorrect.');
    }
    if (user.activated !== true) {
      throw new Error('Account not activated. Check your email for activation link.');
    }
  }),
]}

/* PASSWORD RESET */

// GET /auth/forgot-password
function forgotPasswordForm(req, res, next) {
  res.render('auth/forgot-password', { title: 'Forgot Password' });
}

// POST /auth/password-reset
async function forgotPassword(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/forgot-password', { user: req.body, errors: errors.array() });
  }
  try {
    const token = await cryptoRandomString({length: 10, type: 'url-safe'});
    const user = await User.findOneAndUpdate(
      {email: req.body.email}, 
      {resetToken: token, resetSentAt: Date.now()}, 
      {new: true}
    );
    sendResetPasswordEmail(user.email, token);

    req.flash('info', 'Email sent with password reset instructions.');
    res.redirect('/');    
  } catch (err) {
    next(err); 
  }
}

// Helper function
async function sendResetPasswordEmail(email, token) {
  const html = await ejs.renderFile(
    __dirname + "/../views/email/reset-password.ejs",
    {email: email, token: token }
  );
  const msg = {
    to: email,
    from: 'no-reply@example.com',
    subject: 'Reset Password',
    html: html
  };
  try {
    // View email in the console without sending it.
    console.log('Password Reset Email: ', msg);
    // Uncomment below to send the email.
    /*sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const status = await sgMail.send(msg);
    console.log('Email has been sent!');*/
  } catch(err) {
    console.log('There was an error sending the email. Error: ' + err);
  }
};

// Validator
function validateForgotPw() { return [
  // change email to lowercase, validate not empty.
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .normalizeEmail()
    // custom validator gets user object from DB from email, rejects if not found.
    .custom(async (value, {req}) => {
      const user = await User.findOne({email: value}).exec();
      if (!user) {
        return Promise.reject('Email address not found.');
      }
    })  
]} 

// GET /auth/reset-password
function resetPasswordForm(req, res, next) {
  res.render(
    'auth/reset-password', 
    { title: 'Reset Password', user: {email: req.query.email, resetToken: req.query.token}}
  );
}

// POST /auth/reset-password
async function resetPassword(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);

  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    res.render('auth/reset-password', { user: req.body, errors: errors.array() });
  }
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);     
    const user = await User.findOneAndUpdate(
      {email: req.query.email}, 
      {password: hashedPassword}, 
      { new: true}
    );
    // create the signed json web token expiring in 1 year. 
    const jwtToken = await jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    // Assign the jwt to the cookie expiring in 1 year. 
    // Adding option secure: true only allows https.           
    res.cookie('jwt', jwtToken, { httpOnly: true, maxAge: 31536000000 });       
    req.flash('success', 'Password has been reset.');
    res.redirect(user.url);    
  } catch (err) {
    next(err); 
  }
}
// Validator
function validateResetPw() { return [
  // Validate password at least 6 chars, passwordConfirmation matches password.
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .custom(async (value, { req }) => {
      if (!req.query.token || !req.query.email) { 
        throw new Error('Reset email or token is invalid'); 
      }      
      if (value !== req.body.passwordConfirmation) {
        throw new Error('Password confirmation does not match password');
      }
      let user = await User.findOne({ email: req.query.email, resetToken: req.query.token }).exec(); 
      if (!user) { 
        throw new Error('Reset email or token is invalid'); 
      }
      // validate not more than 2 hours.
      if (Date.now() - user.resetSentAt > 72000000) {
        throw new Error('Password Reset has Expired.');
      }
      // Indicates the success of this synchronous custom validator
      return true;    
    }
  ),
]}

module.exports = router;