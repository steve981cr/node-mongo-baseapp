const express = require('express');
const router = express.Router();

// Pages routes
router.get('/', home);
router.get('/about', about);

// Controller functions
// GET /
function home(req, res) {
  res.render('pages/home', { title: 'Base Node+MongoDB App' });
};

// GET /about
function about(req, res) {
  res.render('pages/about', { title: 'About' });
};

module.exports = router;