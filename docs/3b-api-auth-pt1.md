# Authentication and Authorization <!-- omit in toc -->
## Table of Contents <!-- omit in toc -->
- [Overview](#overview)
- [Routes](#routes)
    - [**`app.js`**](#appjs)
- [RESTful Routes](#restful-routes)
  - [Auth Routes](#auth-routes)
    - [`routes/api/auth.js`](#routesapiauthjs)
  - [User Routes](#user-routes)
    - [`routes/api/users.js`](#routesapiusersjs)
- [Signup](#signup)
    - [`routes/api/auth.js`](#routesapiauthjs-1)
  - [SECRET](#secret)
    - [`.env`](#env)
- [Users Controller Functions](#users-controller-functions)
    - [`routes/api/users.js`](#routesapiusersjs-1)
- [Login/Logout](#loginlogout)
    - [`routes/api/auth.js`](#routesapiauthjs-2)
- [Authorization](#authorization)
    - [`routes/authMiddleware.js`](#routesauthmiddlewarejs)
## Overview
This guide assumes you have created the auth system for a full app and will just cover the differences for an API auth system.

## Routes
* Create an api routes directory and add users.js and auth.js files to it:  
`mkdir routes/api; touch routes/api/users.js; touch routes/api/auth.js`
* Insert the routers as middleware in the app.js file.
* Add a namespace to the api's routes such as "api".
#### **`app.js`**
``` js
// Import the router
const apiAuthRouter = require('./routes/api/auth');
const apiUsersRouter = require('./routes/api/users');
...
// Add the routes as middleware.
app.use('/api/auth', apiAuthRouter);
app.use('/api/users', apiUsersRouter);
```
---
## RESTful Routes
* Depending on your API client you may not need routes for the forms. The client side may contain the code for the forms and may store the data for update and delete forms from the list or detail pages.
* HTML forms can only send GET and POST requests but Clients like React or SmartPhone apps can send GET, POST, PUT and DELETE requests.

### Auth Routes
* Add routes for authentication (signup, login, logout)
* Include placeholders for the callback/handler functions. These can optionally be placed in a separate controller file.
* Include placeholders for validation.

#### `routes/api/auth.js`
``` javascript
const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Auth routes
router.post('/signup', validateSignup(), signup);
router.post('/login', validateLogin(), login);
router.get('/logout', logout);

// Users Controller Function Placeholders
function signup(req, res, next) {}
function login(req, res, next) {}
function logout(req, res, next) {}

// Form Validator & Sanitizer Middleware Placeholders
function validateSignup() { return []}
function validateLogin() { return []}

module.exports = router;
```
### User Routes
* Add RESTful routes for the User collection. 
* Exclude create, since that is handled through the auth signup route.
* Include placeholders for the controller and validation functions.

#### `routes/api/users.js`
``` javascript
const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
 
// Users routes
router.get('/', list);
router.get('/:id', detail);
router.put('/:id/update', validateForm(), update);
router.delete('/:id/delete', destroy);

// Users Controller Function Placeholders
function list(req, res, next) {}
function detail(req, res, next) {}
function update(req, res, next) {}
function destroy(req, res, next) {}

// Form Validator & Sanitizer Middleware Placeholders
function validateForm() {return []}

module.exports = router;
```

---

## Signup
* The signup code for an API is similar to a full app. There are two methods for sending the jwt token. In a cookie or in the response data. The difference will be explained in the login section.
#### `routes/api/auth.js`
``` js
...
// Auth routes
router.post('/signup', validateSignup(), signup);
...
// Users Controller Functions
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
    res.status(201).send(user);
    */
    // Method 2) Send token with response data.
    res.status(201).send({ token, user });
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(400).send("Signup failed.");    
  }
}
...

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

```

### SECRET
Jsonwebtoken requires some secret string or key to hash the token with. Rather than hard coding it, add an environmental variable called SECRET to the .env file in development. 
#### `.env`
```
SECRET=add-some-secret-string-here
```

---
## Users Controller Functions
#### `routes/api/users.js`
``` js
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

## Login/Logout
* Login/logout with an API will be different depending on whether the client is a browser or not. 
  * Front-end libraries or frameworks like React, Angular and Vue are are web clients displayed in the browser so they have access to cookies. JWTs can be added to cookies and sent back and forth between the client and server. 
  * Non-browser clients such as smartphone apps do not natively use cookies, so the JWT token can be sent from the server to the client in the login response body. The client will store the token and send it in the header of HTTP requests to the server.
  * See comments in the code below for adding the jwt to the cookie vs in the login response body.
  * Note: If not using cookies, Auth 2.0 convention is to add the word "Bearer" before the token.
  * For Bearer tokens, logout can be handled completely on the client side by deleting the token from the client so it isn't sent with requests.

#### `routes/api/auth.js`
``` js
...
// Auth routes
router.post('/login', validateLogin(), login);
router.get('/logout', logout);
...
// Users Controller Functions
async function login(req, res, next) {
  // Create object of any validation errors from the request.
  const errors = validationResult(req);
  // if errors send the errors and original request body back.
  if (!errors.isEmpty()) {
    return res.status(422).send({user: {email: req.body.email}, errors: errors.array()});
  }
  try {
    const user = await User.findOne({email: req.body.email}).exec();
    currentUser = {id: user._id, username: user.username, role: user.role};
    const token = jwt.sign({user: currentUser}, process.env.SECRET, 
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
    res.cookie('jwt', token, { httpOnly: true, maxAge: 31536000000 });
    res.send(currentUser);
  } catch (err) {
    console.log("Error: ", err.message);
    res.status(500).send("Log In Failed");
  }
}

// Note: For non-browser clients, logout can be handled on the client side by deleting the bearer token from client storage. So route and controller function aren't needed on the server side.
function logout(req, res, next) {
  res.clearCookie('jwt');
  res.status(200).send('logged out');
}
...
function validateLogin() { return [
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
        return Promise.reject('Email or Password are incorrect.');
      }
      if (user.activated !== true) {
        throw new Error('Account not activated. Check your email for activation link.');
      }
    }),
];}
```

---
## Authorization

* Add a module file to hold the auth middleware:
`touch routes/api/authMiddleware.js`
* Populate the file with functions to check if a user is logged in, if user role is admin.
* The file will be different depending on whether the jwt is in a cookie or in the header.
#### `routes/authMiddleware.js`
**If jwt is in the header:**
``` js
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

const getUser = (req, res, next) => {
  try {
    // get the user token from the headers
    let token = req.headers.authorization;
    // Verify token present and is Bearer type.
    if (!token || token.split(' ')[0] !== 'Bearer') {
      throw new Error("No bearer token.");
    }
    token = token.split(' ')[1];
    // will throw error if invalid token.    
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = decoded.user;
    /* Check that token contains user object not needed since all valid tokens contain user */
    return user;    
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(401).send('Unauthorized');
  }
}

exports.isLoggedIn = (req, res, next) => {
  const user = getUser(req, res, next);
  if (user) next();
}

exports.isAdmin = async (req, res, next) => {
  const user = getUser(req, res, next);
  if (user) {
    try {
      const currentUser = await User.findById(user.id);
      if ((!currentUser.role) || currentUser.role !== 'admin') {
        throw (new Error('Not Admin'));
      }
      next();
    } catch (err) {
      console.error(err.name + ': ' + err.message);
      res.status(401).send('Unauthorized');
    }    
  }
}
```

**If jwt is in a cookie:**
``` js
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

exports.isLoggedIn = (req, res, next) => {
  try {
    jwt.verify(req.cookies.jwt, process.env.SECRET);
    next();
  } catch(err) {
    console.error(err.name + ': ' + err.message);
    res.status(401).send('login');
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
    console.error(err.name + ': ' + err.message);
    res.status(401).send('Unauthorized');
  }
}

```
* To only allow logged-in users to access a page, import the middleware module to the router and add isLoggedIn as a callback to the router function before calling the handler functions.
* To test it out add the below to the routes/api/users.js file:
  
**`routes/api/users.js `**
``` js
...
const auth = require('./authMiddleware');
// Test Auth Middleware
router.get('/testaccess', auth.isLoggedIn, (req, res) => res.send('Access Approved'));
```
* Then test it with Postman or curl.
* Using curl try to access the page without a jwt `curl http://localhost:3000/api/users/testaccess`. This should return Unauthorized.
* To log in with Curl and get a JWT use this command with a username and password in the system: `curl -H "Content-Type: application/json" -X POST -d '{"email":"someuser@example.com","password":"somepassword"}' http://localhost:3000/api/auth/login`. Copy the JWT.
* To test JWT in a cookie use this curl command: `curl --cookie "jwt=PUT-JWT-HERE" http://localhost:3000/api/users/testaccess`
* To test JWT in the header use this curl command: `curl http://localhost:3000/api/users/testaccess -H "Authorization: Bearer PUT-JWT-HERE"`
* It should respond with "Access Approved" with a valid JWT, otherwise it should respond with "Unauthorized".
* You can test isAdmin using a similar approach. 

* To limit article creation to logged in users:

**`routes/api/articles.js`**
``` js
const auth = require('./authMiddleware');
...
router.post('/create', auth.isLoggedIn, validateForm(), create);
...
```