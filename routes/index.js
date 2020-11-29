const express = require('express');
const router = express.Router();
// const articlesController = require('../controllers/articlesController');

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

/*// Articles routes
router.get('/articles', articlesController.list);
router.get('/articles/create', articlesController.createView);
router.post('/articles/create', articlesController.validateForm, articlesController.create);
router.get('/articles/:id', articlesController.details);
router.get('/articles/:id/update', articlesController.updateView);
router.post('/articles/:id/update', articlesController.validateForm, articlesController.update);
router.get('/articles/:id/delete', articlesController.deleteView);
router.post('/articles/:id/delete', articlesController.delete);*/

module.exports = router;