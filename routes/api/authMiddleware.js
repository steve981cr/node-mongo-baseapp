// There are two version to this:
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

// Top version gets jwt from the Header. 
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

// Bottom version gets jwt from a cookie.
/*
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
*/

exports.isCorrectUser = (req, res, next) => {
  const user = getUser(req, res, next);
  if (user) {
    try {
      if (req.params.id !== user.id) {
        throw new Error('Wrong User');      
      }
      next();
    } catch (err) {
      console.error(err.name + ': ' + err.message);
      res.status(403).send('Forbidden');
    }    
  }
}
exports.isCorrectUserN = (req, res, next) => {
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
      res.redirect('/login');
    } else {
      res.redirect('/');
    }
  }
}
