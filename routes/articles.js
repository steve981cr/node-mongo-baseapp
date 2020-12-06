const express = require('express');
const router = express.Router()
const Article = require('../models/article');
const createError = require('http-errors');
const { body, validationResult } = require('express-validator');
const auth = require('./authMiddleware');

// Articles routes
router.get('/', list);
router.get('/create', auth.isLoggedIn, createForm);
router.post('/create', auth.isLoggedIn, validateForm(), create);
router.get('/:id', detail);
router.get('/:id/update', updateForm);
router.post('/:id/update', validateForm(), update);
router.get('/:id/delete', deleteForm);
router.post('/:id/delete', destroy);

// Articles Controller Functions (i.e., router callback/handler functions)
// Optionally, put these in a controllers/articlesController.js file and import it.
// GET /articles
async function list(req, res, next) {
  try {
    const articles = await Article.find({/*published: true*/}, 'title published updatedAt')
    .sort({title: 'asc'}).limit(50).exec();
    res.render('articles/list', { title: 'Articles', articles: articles });
  } catch (err) {
    next(err);
  }
};

// GET /articles/:id
async function detail(req, res, next) {
  try {
    const article = await Article.findById(req.params.id).exec();
    if (article == null) { 
      return next(createError(404));
    }
    res.render('articles/details', { title: 'Article', article: article });   
  } catch (err) {
    next(err);
  }
}

// GET /articles/create
function createForm(req, res, next) {
  res.render('articles/create', { title: 'Create Article' });
}
// POST /articles/create
async function create(req, res, next) {
  // Check request's validation result. Wrap errors in an object.
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('articles/create', { title: 'Create Article', article: req.body, errors: errors.array() });
  }
  try {
    // Limit which fields can be entered.
    const formData = { title, content, published } = req.body;
    const article = await Article.create(formData);
    req.flash('success', 'Article has been created.');
    res.redirect(`/articles/${article.id}`);    
  } catch (err) {
    next(err);
  }
};

// GET /articles/:id/update
async function updateForm(req, res, next) {
  try {
    // Get article fields except createAt and updatedAt
    const article = await Article.findById(req.params.id, '-createdAt -updatedAt').exec();
    if (article == null) {
      return next(createError(404)); 
    }
    res.render('articles/update', { title: 'Update Article', article: article });    
  } catch (err) {
    next(err);    
  }
}

// POST /articles/:id/update
async function update(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('articles/update', { title: 'Update Article', article: req.body, errors: errors.array() });
  }
  try {
    // list the specific fields to update for security. 
    // If all fields can be updated: const formData = req.body;
    const formData = { title, content, published } = req.body;
    await Article.findByIdAndUpdate(req.params.id, formData, {new: true});
    req.flash('success', 'Article has been updated.');
    res.redirect(`/articles/${req.params.id}`);    
  } catch (err) {
    next(err);
  }
};

// GET /articles/:id/delete
async function deleteForm(req, res, next) {
  try {
    // get article title. _id is added automatically.
    const article = await Article.findById(req.params.id, 'title').exec();
    if (article == null) {
      return next(createError(404));
    }
    res.render('articles/delete', { title: 'Delete Article', article: article });    
  } catch (err) {
    next(err);    
  }
}

// POST articles/:id/delete
async function destroy(req, res, next) {
  try {
    await Article.findByIdAndRemove(req.body.id);
    req.flash('info', 'Article has been deleted.');
    res.redirect('/articles');
  } catch (err) {
    next(err);
  }
};

// Validation placeholder
function validateForm() {
  return [
    body('title').trim().not().isEmpty()
    .withMessage('Title is required.').isLength({ max: 200 })
    .withMessage('Title should not exceed 200 characters.')
    .matches(/^[\w'",.!?\- ]+$/)
    .withMessage(`Title should only contain letters, numbers, spaces, and '",.!?- characters.`),
    body('content').trim().escape().isLength({ min: 3 })
    .withMessage('Article content must be at least 3 characters.')
    .isLength({ max: 5000 })
    .withMessage('Article content should not exceed 5000 characters.'),
  ]
}

module.exports = router;
