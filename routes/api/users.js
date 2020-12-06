const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const auth = require('./authMiddleware');

// Test Auth Middleware
router.get('/testaccess', auth.isAdmin, (req, res) => res.send('Access Approved'));
// Go to http://localhost:3000/api/users/testaccess

// Users routes
router.get('/', list);
router.get('/:id', auth.isAdmin, detail);
router.put('/:id/update', validateForm(), update);
router.delete('/:id/delete', destroy);

// Users Controller Functions
// GET /users
async function list(req, res, next) {
  try {
    const users = await User.find({/*activated: true*/}, '_id username email role activated createdAt')
    .sort({'username': 'asc'}).limit(100).exec();
    res.send(users);
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
};

// GET /api/users/:id
async function detail(req, res, next) {
  try {
    const user = await User.findById(req.params.id, '_id username email role activated createdAt').exec();
    if (user == null) { 
      return res.status(404).send("User Not Found");
    }
    res.send(user);    
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
}

// PUT /api/users/:id/update
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
    return res.status(422).send({ user: formData, errors: errors.array() });
  }
  try {
    // if new password submitted encrypt it.
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      formData.password = hashedPassword;
    }
    const user = await User.findByIdAndUpdate(req.params.id, formData, {new: true});
    res.send({id: user._id, username: user.username, email: user.email, updatedAt: user.updatedAt});
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(400).send("User update failed.");     
  }
}

// DELETE /api/users/:id/delete
async function destroy(req, res, next) {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    // On success delete jwt cookie and send success notice.
    res.clearCookie('jwt');
    res.status(200).send("User account deleted."); 
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send("User delete failed.");
  }
}

// Form Validation Middleware
function validateForm() {return [
  // Validate username not empty.
  body('username').not().isEmpty().withMessage('Username cannot be blank.').trim().escape(),
  // Change email to lowercase, validate not empty, valid format, is not in use if changed.
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .isEmail().withMessage('Email format is invalid.')
    .normalizeEmail()
    // Validate that a changed email is not already in use. (Requires db query so maybe change this.)
    .custom(async (value, { req }) => {
      const user = await User.findOne({email: value});
      if (user && user._id.toString() !== req.params.id) {
        return Promise.reject('Email is already in use');
      }
    }),
  // Validate password is at least 6 chars long, matches password confirmation if changed.
  body('password')
    .isLength({ min: 6 }).optional({ checkFalsy: true })
    .withMessage('Password must be at least 6 characters.'),
]}

module.exports = router;