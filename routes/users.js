const express = require('express');
const router = express.Router();
const User = require('../models/user');
const createError = require('http-errors');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
 
// Users routes
router.get('/', list);
router.get('/:id', detail);
router.get('/:id/update', updateForm);
router.post('/:id/update', validateForm(), update);
router.get('/:id/delete', deleteForm);
router.post('/:id/delete', destroy);

// Users Controller Function
// GET /users
async function list(req, res, next) {
  try {
    const users = await User.find({/*activated: true*/}, 'username email')
      .sort({'username': 'asc'}).limit(50).exec();
    res.render('users/list', { title: 'Users', users: users }); 
  } catch (err) {
    next(err);
  }
}

// GET /users/:id
async function detail(req, res, next) {
  try {
    const user = await User.findById(req.params.id, 'username email').exec();
    if (user == null) { 
      return next(createError(404));
    }
    res.render('users/details', { title: 'User', user: user });
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/update
async function updateForm(req, res, next) {
  try {
    const user = await User.findById(req.params.id, 'username email').exec();
    if (user == null) { 
      return next(createError(404));
    }
    res.render('users/update', { title: 'Update User', user: user });
  } catch (err) {
    next(err);
  }
};

// POST /users/:id/update
async function update(req, res, next) {
  // Create form data variable that adds in id and excludes password.
  const formData = {
    username: req.body.username,
    email: req.body.email,
    _id: req.params.id
  };   
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('users/update', { title: 'Update Account', user: formData, errors: errors.array() });
  } 
  try {
    // if new password submitted encrypt it.
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      formData.password = hashedPassword;
    }
    await User.findByIdAndUpdate(req.params.id, formData, {new: true});
    req.flash('success', 'Account updated.');
    res.redirect(`/users/${req.params.id}`);     
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/delete
async function deleteForm(req, res, next) {
  try {
    const user = await User.findById(req.params.id, 'username');
    if (user == null) { return next(createError(404)) }
    res.render('users/delete', { title: 'Delete Account', user: user });
  } catch (err) {
    next(err);  
  }
}

// POST users/:id/delete
async function destroy(req, res, next) {
  try {
    await User.findByIdAndRemove(req.body.id);
    res.clearCookie('jwt');
    req.flash('info', 'Account Deleted.');
    res.redirect('/');
  } catch (err) {
    next(err);     
  }
};

// Form Validator & Sanitizer Middleware
function validateForm() { return [
  // Validate username not empty.
  body('username').trim().not().isEmpty().withMessage('Username cannot be blank.'),
  // Change email to lowercase, validate not empty, valid format, is not in use if changed.
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .isEmail().withMessage('Email format is invalid.')
    .normalizeEmail()
    // Validate that a changed email is not already in use.
    .custom(async function(value, { req }) {
      const user = await User.findOne({email: value})
      if (user && user._id.toString() !== req.params.id) {
        return Promise.reject('Email is already in use');
      }
    }),
  // Validate password is at least 6 chars long, matches password confirmation if changed.
  body('password')
    .isLength({ min: 6 }).optional({ checkFalsy: true })
    .withMessage('Password must be at least 6 characters.')
    .optional({ checkFalsy: true }).custom((value, { req }) => {
      if (value != req.body.passwordConfirmation) {
        throw new Error('Password confirmation does not match password');
      }
      // Indicates the success of this synchronous custom validator
      return true;    
    }
  ),
]}

module.exports = router;