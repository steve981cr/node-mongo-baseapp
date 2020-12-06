# Authentication and Authorization - Pt 2 <!-- omit in toc -->
## Table of Contents <!-- omit in toc -->
- [User Collection](#user-collection)
  - [User File Structure](#user-file-structure)
  - [User model](#user-model)
    - [`models/user.js`](#modelsuserjs)
  - [Install packages](#install-packages)
  - [Add Auth and User Routes](#add-auth-and-user-routes)
    - [`routes/auth.js`](#routesauthjs)
    - [`routes/users.js`](#routesusersjs)
    - [`app.js`](#appjs)
- [Controller Functions](#controller-functions)
  - [Router methods](#router-methods)
- [Signup](#signup)
  - [bcrypt](#bcrypt)
  - [Signup form](#signup-form)
    - [`views/auth/signup.ejs`](#viewsauthsignupejs)
  - [Navbar](#navbar)
    - [`views/layouts/header.ejs`](#viewslayoutsheaderejs)
  - [Controller Functions](#controller-functions-1)
    - [`routes/auth.js`](#routesauthjs-1)
  - [Validation/Sanitation](#validationsanitation)
- [User List and Detail](#user-list-and-detail)
  - [Controller functions](#controller-functions-2)
    - [`routes/users.js`](#routesusersjs-1)
  - [Views](#views)
    - [`views/users/list.ejs`](#viewsuserslistejs)
    - [`views/users/detail.ejs`](#viewsusersdetailejs)
  - [Navbar](#navbar-1)
    - [`views/layouts/header.ejs`](#viewslayoutsheaderejs-1)
- [User Update/Settings](#user-updatesettings)
  - [Controller Functions](#controller-functions-3)
    - [`routes/users.js`](#routesusersjs-2)
  - [Validation/Sanitation](#validationsanitation-1)
  - [View](#view)
    - [`views/users/update.ejs`](#viewsusersupdateejs)
- [User Delete](#user-delete)
  - [Controller functions](#controller-functions-4)
    - [`routes/users.js`](#routesusersjs-3)
  - [View](#view-1)
    - [**`views/users/delete.ejs`**](#viewsusersdeleteejs)
- [Login and out](#login-and-out)
  - [Login Form](#login-form)
    - [`views/auth/login.ejs`](#viewsauthloginejs)
  - [Navbar](#navbar-2)
    - [`views/layouts/header.ejs`](#viewslayoutsheaderejs-2)
  - [LoginForm Controller Function](#loginform-controller-function)
    - [`routes/auth.js`](#routesauthjs-2)
  - [Login/Logout Controller Functions](#loginlogout-controller-functions)
    - [`routes/auth.js`](#routesauthjs-3)
  - [Validation](#validation)
  - [SECRET](#secret)
    - [`.env`](#env)
- [CurrentUser](#currentuser)
    - [`app.js`](#appjs-1)
  - [Navbar](#navbar-3)
    - [`views/layouts/header.ejs`](#viewslayoutsheaderejs-3)
  - [Login on Signup](#login-on-signup)
    - [`routes/auth.js`](#routesauthjs-4)
  - [Log Out on Account Delete](#log-out-on-account-delete)
    - [`routes/users.js`](#routesusersjs-4)
- [Authorization](#authorization)
    - [`routes/authMiddleware.js`](#routesauthmiddlewarejs)
    - [`routes/articles.js`](#routesarticlesjs)
    - [`views/articles/list.ejs`](#viewsarticleslistejs)

---
## User Collection

Creating an authentication system is a bit complicated so we'll do it in steps. That way you can test it and fix any problems you encounter along the way. Start by making a plain User collection with CRUD actions without any of the authentication logic other than hashing the password.
We are using the MVC (Model-View-Controller) architecture.
We are using User as the name of the user collection, but you can use a different name such as Member, Account, etc.

### User File Structure
* Create the necessary directories and files with the below UNIX commands.
```
touch models/user.js
touch routes/auth.js
touch routes/users.js
mkdir views/users
touch views/users/list.ejs
touch views/users/details.ejs
touch views/users/update.ejs
touch views/users/delete.ejs
touch views/users/details.ejs
mkdir views/auth
touch views/auth/signup.ejs
touch views/auth/login.ejs
touch views/auth/forgot-password.ejs
touch views/auth/reset-password.ejs
```

---
### User model

#### `models/user.js`
``` js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, index: true, unique: true },
  password: { type: String },
  role: { type: String },
  activationToken: { type: String },
  activated: { type: Boolean, default: false },
  resetToken: { type: String },
  resetSentAt: { type: Date }
}, {timestamps: true});

// Virtual field for user URL
userSchema.virtual('url').get(function() {
  return '/users/' + this.id;
});

module.exports = mongoose.model('User', userSchema);
```
* The only required property for each field is the type.
* While Mongoose provides built-in validators that you would add as properties in the model's schema, they are not as rubust as those provided by express-validator.
* Add an index and a unique requirement to the email field.
* Make the activated field default to false.
* Role is set to type string, but it could also be an array type if users can have multiple roles.
* The timestamps option will automatically add createdAt and updatedAt fields and insert a timestamp value when a document is created or updated.
* Add a virtual field called url for convenience. We'll use it in the controller functions.

---
### Install packages
`npm install bcrypt`  
`npm install jsonwebtoken` 
* Assumes express, http-errors, and express-validator have already been installed.

---
### Add Auth and User Routes
* Add routes for authentication (signup, login, logout)
* Include placeholders for the callback/handler functions. These can optionally be placed in a separate controller file.
* Include placeholders for validation.

#### `routes/auth.js`
``` javascript
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const createError = require('http-errors');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Auth routes
router.get('/signup', signupForm);
router.post('/signup', validateSignup(), signup);
router.get('/activate-account', activateAccount);
router.get('/login', loginForm);
router.post('/login', validateLogin(), login);
router.get('/logout', logout);
router.get('/forgot-password', forgotPasswordForm);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', resetPasswordForm);
router.post('/reset-password', resetPassword);

// Auth Controller Function and Validator Placeholders
/* SIGNUP */
function signupForm(req, res, next) {}
function signup(req, res, next) {}
function activateAccount(req, res, next) {}
function validateSignup() { return []}
/* LOGIN/LOGOUT */
function loginForm(req, res, next) {}
function login(req, res, next) {}
function logout(req, res, next) {}
function validateLogin() { return []}
/* PASSWORD RESET */
function forgotPasswordForm(req, res, next) {}
function forgotPassword(req, res, next) {}
function validateForgotPw() { return []}
function resetPasswordForm(req, res, next) {}
function resetPassword(req, res, next) {}
function validateResetPw() { return []}

module.exports = router;
```
* Add RESTful routes for the User collection. 
* Exclude create, since that is handled through the auth signup route.
* Include placeholders for the controller and validation functions.

#### `routes/users.js`
``` javascript
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

// Users Controller Function Placeholders
function list(req, res, next) {}
function detail(req, res, next) {}
function updateForm(req, res, next) {}
function update(req, res, next) {}
function deleteForm(req, res, next) {}
function destroy(req, res, next) {}

// Form Validator & Sanitizer Middleware Placeholders
function validateForm() {return []}

module.exports = router;
```
* **App.js file:** Import the routers and add them as middleware. Express Generator has already done this for *users* collection.
#### `app.js`
``` js
...
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
...
app.use('/users', usersRouter);
app.use('/auth', authRouter);
```
---
## Controller Functions
### Router methods
* Syntax: `router.METHOD(path, callback [, callback ...])`
* The router methods such as router.get() and router.post() have two required arguments. 
* First is the URL path such as '/signup' or '/create'.
* Followed by at least one callback function.
* The last handles the HTTP request and returns a response. In the Model-View-Controller design pattern, this function is called a controller function. 
* If there are two or more callback functions then the middle ones are middleware that process the request in some way, such as validating form inputs, or authenticating the user.
* These callback functions can be defined directly in the route, elsewhere in the routes file, or in a separate controller module. We will define them as separate functions in the router file.

---
## Signup
* Standard RESTful routes for a collection include GET Create for a Create form POST Create to Create a new instance of the collection. 
* The User collection will have the standard RESTful routes to create, update and delete users, and read user lists and detail. 
* However, our app will add an authentication layer for users to sign them up, and log them in and out.
* We will use separate authentication and user route paths.
* Instead of putting that with the users routes, it is in the auth routes as signup.

### bcrypt
* For security reasons, don't save raw passwords to the database in case the DB is compromised. Instead make the saved passwords indecipherable by hashing them with the bcrypt package.
* Bcrypt Docs: <a href="https://github.com/kelektiv/node.bcrypt.js#readme">Readme</a>
* To install bcrypt (we already did this): `npm install bcrypt`

### Signup form
* Add the html/ejs for the signup form.
* The below is without Bootstrap classes. The actual file contains basic Bootstrap styling.

#### `views/auth/signup.ejs`
``` html
<% include ../layouts/header %>

<h1>Sign Up</h1>

<% include ../layouts/form-errors %>

<form method="POST" action="/auth/signup">
  <div>
    <label for="username">Username</label>
    <input type="text" name="username" value="<%= typeof user === 'undefined' ? '' : user.username %>" maxlength="50" required autofocus>
  </div>

  <div>
    <label for="email">Email</label>
    <input type="email" name="email" value="<%= typeof user === 'undefined' ? '' : user.email %>" maxlength="50" required>
  </div>

  <div>
    <label for="password">Password (must be at least 6 characters)</label>
    <input type="password" name="password" minlength="6" maxlength="32" required>
  </div>

  <div>
    <label for="passwordConfirmation">Confirm Password</label>
    <input type="password" name="passwordConfirmation" required>
  </div>

    <button type="submit">Submit</button>
    <span>Already a member? <a href="/auth/login">Log in</a></span>
  </div>
</form>

<% include ../layouts/footer %>
```

### Navbar
* Add signup link to the navbar.
#### `views/layouts/header.ejs`
``` html
<li class="nav-item"><a href="/auth/signup" class='nav-link'>Signup</a></li>
```

### Controller Functions
* There is a route and controller function to handle a GET request for the signup form.
* The form is submitted with a POST request.

#### `routes/auth.js`
``` js
// Routes
router.get('/signup', signupForm);
router.post('/signup', validateSignup(), signup);
...
// GET /signup
function signupForm(req, res, next) {
  res.render('auth/signup', { title: 'Signup' });
};

// POST /signup
async function signup(req, res, next) {
  // Limit which fields can be entered. Exclude password for now.
  const formData = { username, email } = req.body;  
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // If errors, send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { title: 'Signup', user: formData, errors: errors.array() });
  }
  try {
    formData.password = await bcrypt.hash(req.body.password, 10);
    formData.activated = true; // No separate activation step
    const user = await User.create(formData);
    req.flash('success', 'Account Created.');
    res.redirect(`/users/${user.id}`);
  } catch (err) {
    next(err);
  }
};
```
* FormData variable: Extract the specific form fields from the request body to prevent hackers from adding form fields.
  * Exclude password for now. If there are validation errors we'll send back the form data excluding password.
* The validateSignup() middleware will check the form data for errors and do some sanitation. If there are errors we'll render the signup form again with the form field values the entered (except password) and the errors.
* If no errors, encrypt the password. Never save unencrypted passwords to the database in case it gets compromised.
  * Bcrypt hash method: `bcrypt.hash(myPlaintextPassword, saltRounds)`
  * In cryptography, a salt is random data that is used as an additional input to a one-way function that hashes data, a password or passphrase. Salts are used to safeguard passwords in storage.
* For now we will immediately activate the account. Later we will add an email verification step before activating.
* Save the user data to the database.
* When we get to the log-in section we'll come back to this and log the user in when they sign up.

### Validation/Sanitation
* We are using express-validator for form validation and sanitation. Validation checks values, sanitation modifies them (e.g., trim whitespace, downcase email)
  * Express-validator Docs: <a href="https://express-validator.github.io/docs/">Getting Started</a> | <a href="https://express-validator.github.io/docs/check-api.html">API</a>
  * Installation: `npm install express-validator`
* The signup router function contains validation middleware.
* Signup controller function starts with validation error handling statements. Right now the validation function is empty so commenting out the error handling statements won't affect anything.
* Populate the validateSignup function at the bottom of routes/auth.js. The function returns an array where there is an element for each field that gets validated.
* Note: this doesn't have to be a function. You could just assign the array to a variable called validatesSignup, but you would have to place it above the routes that reference it. Since functions are hoisted you can place them after the router function that calls it. 
* HTML Form Field Validations:
  * The HTML form fields also contain validations including:
    * Making the field required.
    * Min and max number of characters 
    * Email format. 
  * This give immediate feedback on the client side without having to send it to the server. 
  * This is insufficient however because these checks can be circumvented. 
``` js
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
        const user = await User.findOne({where: {email: value}});
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
```
* You can now referesh the browser, click on the signup link, and test the validator for invalid fields. The form uses html form validators as well.
* A valid signup, however, will stall on the redirect to the detail page since that hasn't been populated yet. 

---
## User List and Detail 
* Create the list and detail controller functions and views.

### Controller functions
* Get all users ordered by username.
#### `routes/users.js`
``` js
// Routes
router.get('/', list);
router.get('/:id', detail);
...
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
```

### Views
* Below are basic views for the list and detail pages. The actual files include some basic Bootstrap classes not shown here.
#### `views/users/list.ejs`
``` html
<% include ../layouts/header %>

<h1>Users</h1>
<hr>
<ul>
  <% users.forEach(function(user) { %>
    <li><a href="/users/<%= user.id %>"><%= user.username %> - <%= user.email %></a></li>
  <% }); %>
</ul>

<% include ../layouts/footer %>
```

#### `views/users/detail.ejs`
``` html
<% include ../layouts/header %>

<h2 class='mt-4'>
  <%= user.username %> Account
  <a href="/users/<%= user.id %>/update" class='btn btn-info float-right'>Settings</a>
</h2>
<hr>
<p><b>Email:</b> <%= user.email %></p>
<% if (user.role) { %>
  <p><b>Role:</b> <%= user.role %></p>
<% } %>

<% include ../layouts/footer %>
```

### Navbar
* Add users link to the navbar.
#### `views/layouts/header.ejs`
``` html
<li class="nav-item"><a href="/users" class='nav-link'>Users</a></li>
```

* You can now sign up a user and it will redirect to the user detail page.
* And go to the users list page from the navbar.

---
## User Update/Settings
### Controller Functions
* There are two routes. One to display the Update form and one to post it.
#### `routes/users.js`
``` js
router.get('/:id/update', updateForm);
router.post('/:id/update', validateForm(), update);
...
// GET /users/:id/update
async function updateForm(req, res, next) {
  try {
    const user = await User.findById(req.params.id, 'username email').exec();
    if (user == null) { 
      return next(createError(404));
    }
    res.render('users/update', { title: 'Update Account', user: user });
  } catch (err) {
    next(err);
  }
};

// POST /users/:id/update
async function update(req, res, next) {
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
```

### Validation/Sanitation
* Add the validateForm function at the bottom of the routes/users.js file.
``` js
// Form Validator & Sanitizer Middleware
function validateForm() {return [
  // Validate username not empty.
  body('username').trim().not().isEmpty().withMessage('Username cannot be blank.'),
  // Change email to lowercase, validate not empty, valid format, is not in use if changed.
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .isEmail().withMessage('Email format is invalid.')
    .normalizeEmail()
    // Validate that a changed email is not already in use.
    .custom(async (value, { req }) => {
      const user = await User.findOne({where: {email: value}});
      if (user && user.id != req.params.id) {
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
```

### View
#### `views/users/update.ejs`
``` html
<% include ../layouts/header %>

<h1>User Settings</h1>

<% include ../layouts/form-errors %>

<form method="POST" action="/users/<%= user.id %>/update">
  <div>
    <label for="username">Userame</label>
    <input type="text" name="username" value="<%= typeof user === 'undefined' ? '' : user.username %>" maxlength="50" required>
  </div>

  <div>
    <label for="email">Email</label>
    <input type="email" name="email" value="<%= typeof user === 'undefined' ? '' : user.email %>" required>
  </div>

  <div>
    <label for="password">Change Password (must be at least 6 characters)</label>
    <input type="password" name="password" minlength="6" maxlength="32">
  </div>
  <div>
    <label for="passwordConfirmation">Confirm Password</label>
    <input type="password" name="passwordConfirmation">
  </div>

  <div>
    <button type="submit">Submit</button>
    <a href="/users/<%= user.id %>">Cancel</a>
  </div>
</form>

<hr>

<h3>Delete Account</h3>
<a href="/users/<%= user.id %>/delete">Delete</a>

<% include ../layouts/footer %>
```

---
## User Delete
* Create the delete controller functions and view.
* We're naming the function *destroy* because *delete* is a JS keyword.

### Controller functions
#### `routes/users.js`
``` js
// Routes
router.get('/:id/delete', deleteForm);
router.post('/:id/delete', destroy);
...
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
    req.flash('info', 'Account Deleted.');
    res.redirect('/');
  } catch (err) {
    next(err);     
  }
};
```

### View
#### **`views/users/delete.ejs`**
``` html
<% include ../layouts/header %>

<h1>Delete Account: <%= user.username %></h1>

<hr>
<p>
  Are you sure you want to delete this account?
  <form method='POST' action='/users/<%= user.id %>/delete'>
    <input type="hidden" name="id" value="<%= user.id %>">
    <button type='submit'>Yes - Delete Account</button>
    <a href="/users/<%= user.id %>">No - Cancel</a>
  </form>
</p>

<% include ../layouts/footer %>
```
* Restart the app and test it to make sure all 4 CRUD actions work. And you should see the flash messages after signup, update and delete.
  * `npm start` or `nodemon`
  * View the app at `http://localhost:3000`
  * Create a user, update account, delete account. 
  * Be sure to try submitting forms with errors such as passwords that don't match and already in use email address.

---

## Login and out
To restrict pages to registered users, specific users, or specific user roles you need to authenticate who the user is.
To do this, add login and logout functions, and store a JSON web token that identifies the user in a cookie.
* Use the jsonwebtoken package.
* Jsonwebtoken Docs: <a href="https://github.com/auth0/node-jsonwebtoken">Readme</a>
* Installation (we already installed it): `npm install jsonwebtoken`

### Login Form
* Add the login form. 
* The below code does not include any styling. The actual code in the file includes Bootstrap classes.
#### `views/auth/login.ejs`
``` html
<% include ../layouts/header %>

<h1>Log In</h1>

<% include ../layouts/form-errors %>

<form method="POST" action="/auth/login">
  <div>
    <label for="email">Email</label>
    <input type="email" name="email" value="<%= typeof user === 'undefined' ? '' : user.email %>" required autofocus>
  </div>

  <div>
    <label for="password">Password</label> (<a href="/auth/forgot-password" tabindex="-1">Forgot Password?</a>)
    <input type="password" name="password" required>
  </div>

  <div>
    <button type="submit">Submit</button>
    <span>New user? <a href="/auth/signup">Sign up now!</a></span>
  </div>
</form>

<% include ../layouts/footer %>
```

### Navbar
* Add login link to the navbar.
#### `views/layouts/header.ejs`
``` html
<li class="nav-item"><a href="/auth/login" class='nav-link'>Log in</a></li>
```

### LoginForm Controller Function
#### `routes/auth.js`
``` js
// Routes
router.get('/login', loginForm);
...
// GET /login
function loginForm(req, res, next) {       
  res.render('auth/login', { title: "Log In" });
};
```
* You should be able to view the login form by clicking the link in the browser.

### Login/Logout Controller Functions
#### `routes/auth.js`
``` js
...
// Routes
router.post('/login', validateLogin(), login);
router.get('/logout', logout);
...
// POST /login
async function login(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.render('auth/login', { user: {email: req.body.email}, errors: errors.array() });
  }
  const user = await User.findOne({email: req.body.email}).exec();
  // Create an encrypted token that contains user data.
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
}
// GET /logout
function logout(req, res, next) {
  res.clearCookie('jwt');
  req.flash('info', 'Logged out.');
  res.redirect('/');
}
```
* User submits email and password to log in. 
* The credentials are first verified in the validateLogin() middleware (covered below).
* If the validator throws an error then the login page is rendered again sending the email value entered and the errors array. The email entered and error message are displayed back to the user.
* If validation passes, find the user in the database by the email.
* We haven't been using the role property. You can optionally assign different roles to users on signup. For now we'll set role to 'standard' if it is not defined.
* Create a signed JWT token. 
  * Syntax: `jwt.sign(*payload, secretOrPrivateKey, [options, callback*])`
  * For the payload we'll add a user object with fields for id, username and role.
  * It is hashed using the SECRET environmental variable defined in the .env file.
  * We'll give it an expiration life of one year.
* Add the jwt to the cookie. The cookie is attached to the HTTP requests and responses. 
  * Cookies can also have an expiration life. We'll expire the cookie in one year as well. Set it in milliseconds. 3600000 is 1 hour. 31536000000 is one year.
  * To restrict the jwt cookie to https protocol then add the secure:true option. `res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000, secure: true });`
* The logout function clears the jwt from the cookie and redirects to the home page.

### Validation
* Use Express-Validator to confirm that email and password credentials.
* Comment out checking of the account is activated until that functionality is added.
``` js
function validateLogin() {return [
  body('password')
    .not().isEmpty().withMessage('Password cannot be blank.'),
  body('email')
    .not().isEmpty().withMessage('Email cannot be blank.')
    .normalizeEmail()
    // custom validator gets user object from DB from email, rejects if not present, compares user.password to hashed password from login.
    .custom(async (value, {req}) => {
      const user = await User.findOne({email: value}).exec();
      if (!user) {
        return Promise.reject('Email or Password are incorrect.');
      }
      const passwordIsValid = await bcrypt.compare(req.body.password, user.password);
      if (!passwordIsValid) {
        throw new Error('Email or Password are incorrect.');
      }
      if (user.activated !== true) {
        throw new Error('Account not activated. Check your email for activation link.');
      }
  }),
]}
```
* When the user submits the login form it has two fields, email and password.
* Validate Login:
  * The login route calls the validateLogin() middleware. This uses the express-validator body method to validate the login.
  * First check if the password field is filled out. This is a backup check since the client should also check that it is not empty before submitting.
  * Then check if email is filled out. 
  * Normalize the email. The normalizeEmail method downcases it before searching the DB since the email was downcased before saving it.
  * Use a custom validator to check the email and password against the database.
  * Find the user in the DB from the email.
  * Bcrypt's compare method compares the hashed passwords.
  * If the email is not found or if the passwords don't match then the validation fails.
    * Use the same error message for both so a hacker can't tell which field is causing the error.
    * For the rejection you can either throw an error: `throw new Error('Email or Password are incorrect.');`
    * Or reject the promise: `return Promise.reject('Email or Password are incorrect.');`
  * Check that account is activated.
### SECRET
Jsonwebtoken requires some secret string or key to hash the token with. Rather than hard coding it, add an environmental variable called SECRET to the .env file in development. 
#### `.env`
```
SECRET=add-some-secret-string-here
```

---

## CurrentUser
* Add currentUser to local storage. This is used for conditional statements in the view files. For instance show logout button if there is a currentUser and login button if not.
* Make sure to place this before app.use('/', router); or the page will display before getting the currentUser object.
* Import jsonwebtoken module at the top of the file.

#### `app.js`
``` js
const jwt = require('jsonwebtoken');
...
// Add current user to local storage
const getCurrentUser = (token) => {
  if (token) {
    let decoded = jwt.verify(token, process.env.SECRET);
    const user = decoded.user || '';
    return user;
  }
}
app.use((req, res, next) => {
  res.locals.currentUser = getCurrentUser(req.cookies.jwt);
  next();
});
...
app.use('/', router);
```

### Navbar
* Add login and logout links to the navbar.
* Use a conditional to show logout link if user is logged in and signup and login links if not.
* The actual HTML file includes a bootstrap dropdown menu.
#### `views/layouts/header.ejs`
``` html
...
<% if(!currentUser){ %>
  <li class="nav-item"><a class="nav-link" href="/auth/signup">Sign Up</a></li>
  <li class="nav-item"><a class="nav-link" href="/auth/login">Log In</a></li>   
<% } else { %>
  <li class="nav-item"><a class="nav-link" href="/auth/logout">Log out</a></li>         
<% } %>
...
```

### Login on Signup

* Log in user when they sign up by with the below block of code: 
  ``` js
    // On success - login user and redirect.
    const token = jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
  ```

* Insert into the signup controller function:

#### `routes/auth.js` 
``` js
...
try {
  formData.password = await bcrypt.hash(req.body.password, 10);
  formData.activated = true; // No separate activation step
  const user = await User.create(formData);
  /* INSERT LOGIN CODE HERE */
  req.flash('success', 'Account Created.');
  res.redirect(`/users/${user._id}`);
} ...
```
* Test that a user is automatically logged in when they successfully sign up.

### Log Out on Account Delete
* When a user deletes their account they need to be logged out. 
* Add one statement to the users controller delete function that clears the jwt cookie.

#### `routes/users.js` 
``` js
...
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
```

* Test that a user is automatically logged out when they delete their account.

---
## Authorization

* To limit access to controller actions based on whether a user is logged in, is the correct user, or has the right role we need to add middleware to protect the routes.
* Add a module file to hold the auth middleware:
`touch routes/authMiddleware.js`
* Populate the file with functions to check if a user is logged in, if user role is admin, or if user is the correct user.
#### `routes/authMiddleware.js`
``` js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.isLoggedIn = (req, res, next) => {
  try {
    jwt.verify(req.cookies.jwt, process.env.SECRET);
    next();
  } catch(err) {
    console.log(err.name + ': ' + err.message);
    res.redirect('/auth/login'); 
  }
}

exports.isAdmin = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.cookies.jwt, process.env.SECRET);
    const currentUser = await User.findById(decoded.user.id);
    if ((!currentUser.role) || currentUser.role !== 'admin') {
      throw (new Error('Unauthorized'));
    }
    next();
  } catch (err) {
    console.log(err.name + ': ' + err.message);
    if (err.name === 'JsonWebTokenError') {
      res.redirect('/auth/login');
    } else {
      res.redirect('/');
    }
  }
}

exports.isCorrectUser = (req, res, next) => {
  try {
    const decoded = jwt.verify(req.cookies.jwt, process.env.SECRET);
    if (req.params.id !== decoded.user.id) {
      res.redirect('/');
      throw new Error('Unauthorized');      
    }
    next();
  } catch (err) {
    console.log(err.name + ': ' + err.message);
    if (err.name === 'JsonWebTokenError') {
      res.redirect('/auth/login');
    } else {
      res.redirect('/');
    }
  }
}
```

* To only allow logged-in users to access a page, import the middleware module to the router and add isLoggedIn as a callback to the router function before calling the handler functions.
* For example, you may only want registered users to be able to post an article.

#### `routes/articles.js`
``` js
const auth = require('./authMiddleware');
...
router.get('/create', auth.isLoggedIn, createForm);
router.post('/create', auth.isLoggedIn, validateForm(), create);
...
```
* To only show the create button to logged in users add a conditional:
#### `views/articles/list.ejs`
``` html
<% if(currentUser) { %>
  <a href='/articles/create' class='btn btn-primary float-right'>
Create new article</a>
<% } %>
```