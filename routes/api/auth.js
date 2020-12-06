const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');

// Auth routes
router.post('/signup', validateSignup(), signup);
router.post('/login', validateLogin(), login);
router.get('/logout', logout);

// Auth Controller Functions
/* LOGIN/LOGOUT */

// POST /signup No Activation Step
async function signup(req, res, next) {
  // Limit which fields can be entered. Exclude password for now.
  const formData = { username, email } = req.body;
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.status(422).send({ user: formData, errors: errors.array() });
  }
  try {
    // Encrypt the password for security
    formData.password = await bcrypt.hash(req.body.password, 10);
    formData.activated = true; // No separate activation step
    let user = await User.create(formData);
    // On success - generate and send JWT.
    user = {id: user._id, username: user.username, role: user.role};
    const token = jwt.sign({ user: user }, process.env.SECRET, { expiresIn: '1y' }); 
    /*
    // Method 1) Assign the jwt to a cookie. Expires in one year. 
    res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
    res.status(201).send(user);*/
    // Method 2) Send token with response data.
    res.status(201).send({ token, user });
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(400).send("Signup failed.");    
  }
}

// POST /signup Activation Required
async function signupActivationRequired(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.status(422).send({ user: req.body, errors: errors.array() });
  }
  try {
    // Encrypt the password for security
    req.body.password = await bcrypt.hash(req.body.password, 10);
    // Limit which fields can be entered.
    const { username, email, password } = req.body;
    const activationToken = await cryptoRandomString({length: 10, type: 'url-safe'});
    const user = await User.create({username, email, password, activationToken});
    sendActivationEmail(username, email, activationToken); 
    res.status(200).send('Please check your email to activate your account.'); 
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(400).send("Signup failed.");    
  }
}

// Form Validator Middleware
function validateSignup() { return [
  // validate username not empty.
  body('username').not().isEmpty().withMessage('Username cannot be blank.').trim().escape(),
  // change email to lowercase, validate not empty, valid format, not in use.
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .isEmail().withMessage('Email format is invalid.')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({email: value}).exec();
      if (user) {
        return Promise.reject('Email is already in use');
      }
    }),
  // Validate password at least 6 chars.
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
]}

/* LOGIN/LOGOUT */

async function login(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.status(422).send({user: {email: req.body.email}, errors: errors.array()});
  }
  try {
    let user = await User.findOne({email: req.body.email}).exec();
    user = {id: user.id, username: user.username, role: user.role};
    const token = jwt.sign({user: user}, process.env.SECRET, 
      { expiresIn: '1y' });
    // Send token and user data back to client
    /* Two ways this can be done:
      // 1) Assign the jwt to a cookie. Expires in one year. 
        res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
        res.send(currentUser);      
      // 2) Send the jwt token in the response.
        res.send({ token, user });
        // Or use Auth 2.0 convention of adding "bearer" before the token:
        res.send({ "Bearer " + token, user });
    */
    res.send({ token, user }); // Send token without cookie
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send("Log In Failed");
  }
}

// Note: Server-side logout route/function not required for non-browser clients.
function logout(req, res, next) {
  res.clearCookie('jwt');
  res.status(200).send('logged out');
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
      /*if (user.activated != true) {
        throw new Error('Account not activated. Check your email for activation link.');
      }*/
    }),
]}

/* PASSWORD RESET */

module.exports = router;