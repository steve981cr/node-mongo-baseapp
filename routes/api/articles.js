const express = require('express');
const router = express.Router();
const Article = require('../../models/article');
const { body, validationResult } = require('express-validator');

// Articles routes
router.get('/', list);
router.post('/create', validateForm(), create);
router.get('/:id', detail);
router.get('/:id/update', updateForm);
router.put('/:id/update', validateForm(), update);
router.delete('/:id/delete', destroy);

// Controller functions
// GET /api/articles
async function list(req, res, next) {
  try {
    const articles = await Article.find({published: true}, 'title published createdAt')
    .sort({title: 'asc'}).limit(50).exec();
    res.send(articles);
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
};

// GET /api/articles/:id
async function detail(req, res, next) {
  try {
    const article = await Article.findById(req.params.id).exec();
    if (article == null) { 
      return res.status(404).send("Article Not Found");
    }
    res.send(article);    
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
}

// POST /api/articles/create
async function create(req, res, next) {
  // Check request's validation result. Wrap errors in an object.
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send(errors);
  }
  try {
    // Limit which fields can be entered.
    const formData = { title, content, published } = req.body;
    const article = await Article.create(formData);
    res.status(201).send(article);
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
}

// GET /api/articles/:id/update
async function updateForm(req, res, next) { 
  try {
    // Get article fields except createAt and updatedAt
    const article = await Article.findById(req.params.id, '-createdAt -updatedAt').exec();
    if (article == null) { 
      return res.status(404).send('article not found');
    }
    res.send(article); 
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
}

// PUT /api/articles/:id/update
async function update(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send(errors);
  }
  try {
    // list the specific fields to update for security. 
    // If all fields can be updated: const formData = req.body;
    const formData = { title, content, published } = req.body;
    const updatedArticle = await Article.findByIdAndUpdate(req.params.id, formData, {new: true});
    res.send(updatedArticle);
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message); 
  }
}

// DELETE /api/articles/:id/delete
async function destroy(req, res, next) {
  try {
    const article = await Article.findByIdAndRemove(req.params.id);
    if (!article) {
      return res.status(404).send('article not found');
    } 
    res.status(204);
  } catch (err) {
    console.error(err.name + ': ' + err.message);
    res.status(500).send(err.message);
  }
}

// Form Validator & Sanitizer Middleware
// To make it a variable instead of a function, move it above the routes and assign it:
//   const validateForm = [...];
//   Then in the router function change validateForm() to validateForm.
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