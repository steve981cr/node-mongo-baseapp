# Make an API version of the Articles collection
* Create an api routes directory and add articles.js file to it:  
`mkdir routes/api; touch routes/api/articles.js`
* Insert the router as middleware in the app.js file.
* Add a namespace to the api's routes such as "api".
#### **`app.js`**
``` js
// Import the router
const apiArticlesRouter = require('./routes/api/articles');
...
// Add the route as middleware.
app.use('/api/articles', apiArticlesRouter);
```
---
## RESTful Routes
* Depending on your API client you may not need routes for the forms. The client side may contain the code for the forms and may store the data for update and delete forms from the list or detail pages.
* HTML forms can only send GET and POST requests but clients like React or SmartPhone apps can send GET, POST, PUT and DELETE requests.

``` js
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

// Controller functions placeholders
function list(req, res, next) {}
function create(req, res, next) {}
function detail(req, res, next) {}
function updateForm(req, res, next) {}
function update(req, res, next) {}
function destroy(req, res, next) {}

// Validation placeholder
function validateForm() { return []; }

module.exports = router;
```

---
## Controller functions
* The controller functions are essentially the same as for a standard web app except instead of responding with HTML pages it sends data, usually in JSON format. The data is received and displayed with views on the client side.
* With APIs, status codes have more significance. The client may handle the response differently depending on the status code.
* The validator function is also added at the bottom. No changes from the original articles validator.
* We are putting the controller functions in the collection's router file below the routes. Another option is to move these to a separate controller file:
  * `controllers/api/articlesController.js` 
  * And imported to the articles router file with: `const controller = require('../../controllers/api/articlesController');
  * Then you would append it to the controller functions like: controller.list, controller.detail, etc.
* The validator function is also added at the bottom. No changes from the original articles validator.
* The actual code in routes/api/articles.js includes the User association discussed later. The pasted code below does not.
* Notes:
  * The res.send() method converts objects and arrays to JSON format before sending it but sends string data as strings. Res.json() converts all data to JSON including strings.
  * You can send error messages as strings `res.send(err.message)` or objects `res.send({message: err.message})` depending on how you want to receive them on the client side.

``` js
// Controller functions
// GET /api/articles
async function list(req, res, next) {
  try {
    const articles = await Article.find({published: true}, 'title published createdAt')
    .sort({title: 'asc'}).limit(50).exec();
    res.send(articles);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// GET /api/articles/:id
async function detail(req, res, next) {
  try {
    console.log(44, req.params.id);
    const article = await Article.findById(req.params.id).exec();
    if (article == null) { 
      return res.status(404).send("Article Not Found");
    }
    res.send(article);    
  } catch (err) {
    console.log('Error querying article', JSON.stringify(err));
    res.status(500).send(err.message);
  }
}

// POST /api/articles/create
async function create(req, res, next) {
  // Check request's validation result. Wrap errors in an object.
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors);
  }
  try {
    // Limit which fields can be entered.
    const formData = { title, content, published } = req.body;
    const article = await Article.create(formData);
    res.status(201).send(article);
  } catch (err) {
    console.log('Error creating a article', JSON.stringify(err));
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
    console.log('Error finding article', JSON.stringify(err))
    res.status(500).send(err.message);
  }
}

// PUT /api/articles/:id/update
async function update(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors);
  }
  try {
    // list the specific fields to update for security. 
    // If all fields can be updated: const formData = req.body;
    const formData = { title, content, published } = req.body;
    const updatedArticle = await Article.findByIdAndUpdate(req.params.id, formData, {new: true});
    res.send(updatedArticle);
  } catch (err) {
    console.log('Error updating article', JSON.stringify(err));
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
    console.log('Error deleting article', JSON.stringify(err));
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
```
