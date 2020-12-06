# Add an Articles Collection to the base app.
* These are the instructions that were used to add an articles collection to this app. 
* You can recreate it by following these instructions.
* We will persist the data with a MongoDB database.
* We will use the Mongoose ODM package to interface with MongoDB.
* We will use express-validator to validate/sanitize form data.

---
## 1) Model
* Mongoose Docs: <a href="https://mongoosejs.com/docs/models.html">Models</a> | <a href="https://mongoosejs.com/docs/api/model.html#model_Model">API</a>
* Create a model folder and file for the collection: `mkdir models; touch models/article.js`

#### **`models/article.js`**
``` js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  title: { type: String },
  content: { type: String },
  published: { type: Boolean, default: false },
}, {timestamps: true});

module.exports = mongoose.model('Article', articleSchema);
```

* Articles have three fields: title, content, and published.
* The timestamps option will automatically add createdAt and updatedAt fields
and insert a timestamp value when a document is created or updated.
* The only required property for each field is the type.
* While Mongoose provides properties for input validation, the express-validator package is more robust and also provides sanitation methods so we will use that.
* Add a default value of <i>false</i> to the <i>published</i> boolean field.

## 2) Routes
* Create and populate the router file for the collection. It will hold the routes, controller, and form validations.
* Add the collection's router as middleware to the app.

### 2.1) Add articles router middleware to app.js
* Import the routes/articles.js router module.
* Add it as middleware to the app.

#### **`app.js`**
``` js
const articlesRouter = require('./routes/articles');
...
app.use('/articles', articlesRouter);
```
* Now any HTTP request to /articles will be handled by the articlesRouter module.

### 2.2) Add routes
* Create a file for the articles collection routes: `touch routes/articles.js`
* Add the routes for the Articles collection.
* At the top import Express and instantiate an express router. 
* The controller functions will also be placed in this file. For that we will need to import:
  * The Article model. 
  * The http-errors package to format errors for http responses. 
  * Express-validator to validate and/or sanitize form data.
  * Install express-validator if you haven't already: `npm install express-validator`
* Add a router method for each route.  
  `router.METHOD(path, callback [, callback ...])`
* The router.get() method serves GET requests for HTML pages including:
  * List page of all articles, or a filtered list of articles.
  * Detail page showing a specific article.
  * Form pages to Create, Update, and Delete an article.
* the router.post() method handles POST requests with form data including:
  * forms data to Create, Update, and Delete an article.
  * HTML forms can only send POST or GET requests.
* Add placeholder controller functions for the router callbacks.
* Add a placeholder for form validation.

#### **`routes/articles.js`**
``` JavaScript
const express = require('express');
const router = express.Router()
const Article = require('../models/article');
const createError = require('http-errors');
const { body, validationResult } = require('express-validator');

// Articles routes
router.get('/', list);
router.get('/create', createForm);
router.post('/create', validateForm(), create);
router.get('/:id', detail);
router.get('/:id/update', updateForm);
router.post('/:id/update', validateForm(), update);
router.get('/:id/delete', deleteForm);
router.post('/:id/delete', destroy);

// Controller functions placeholders
function list(req, res, next) {}
function createForm(req, res, next) {}
function create(req, res, next) {}
function detail(req, res, next) {}
function updateForm(req, res, next) {}
function update(req, res, next) {}
function deleteForm(req, res, next) {}
function destroy(req, res, next) {}

// Validation placeholder
function validateForm() { return []; }

module.exports = router;
```

---
## 4) Views setup
* Add a view folder and files for the articles.
```
mkdir views/articles
touch views/articles/list.ejs
touch views/articles/details.ejs
touch views/articles/create.ejs
touch views/articles/update.ejs
touch views/articles/delete.ejs
```

### Add form-errors partial
* Add a partial HTML template to display create and update form errors  
`touch views/layouts/form-errors.ejs`
#### `views/layouts/form-errors.ejs`
``` html
<% if (typeof errors !== 'undefined') { %>
  <ul class='list-group mt-1'>
    <li class='list-group-item list-group-item-danger py-1'>
      <strong>Correct Any Errors Below And Resubmit:</strong>
    </li>
    <% for (const error of errors) { %>
      <li class='list-group-item text-danger border-danger py-1'>
        <%= error.msg %>
      </li>
    <% } %>
  </ul>
<% } %>
```
* The create and update form templates import the partial. 

---
## 3&4.1) List Controller Function and View
### Route
* GET Requests to /articles are handled by the controller list function.
``` JavaScript
router.get('/', list);
```
### Controller List Function
``` JavaScript
// GET /articles
async function list(req, res, next) {
  try {
    const articles = await Article.find({published: true}, 'title published createdAt')
    .sort({title: 'asc'}).limit(50).exec();
    res.render('articles/list', { title: 'Articles', articles: articles });
  } catch (err) {
    next(err);
  }
};
```
* Wrap the query in a try/catch block. That way if there is an error the catch clause will handle it. 
* Query the database using the Mongoose find() function chained to the Article model.
  * All database queries are asynchronous, so add await so the function will wait for the results before going to the next statement.
  * Optionally apply a filter option as the first argument to only find published articles. 
  * The second argument lets you specify which attributes to pull. For the list page we are excluding the content attribute.
  * Chain sort and limit methods to modify the query Sort the articles by title in ascending order.
  * Mongoose ODM will query the database and convert the results into an array of article objects.
* Render the list view template, passing in a variables object containing the title and articles array from the database.
* If there is an error catch it.
  * Call the next() method passing in the error object as the argument. Express will then pass it to the error handling function at the bottom of the app.js file and display the error HTML page.

### List View
* See the views/articles/list.ejs file for the HTML and EJS code.
* At the top is a button link to the Create article form.
* Iterate over the articles array displaying each article title with a link to the article detail page.
* You can display the results as an unordered list, an ordered list, a description list, a table, or some other format. 
* The example uses an Unordered list, but has commented out code for a description list and a table. 

---
## 3&4.2) Detail Route, Controller Function, View
### Route
* GET Requests to /articles/:id are handled by the controller details function.
* :id is a route parameter. It can be accessed in the controller from the request params property `req.params.id`.
``` JavaScript
router.get('/:id', detail);
```
### Controller Details Function

``` JavaScript
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
```
* The details controller function pulls the article from the database and renders the details template.
* Call the Mongoose findById() method passing in the article id taken from the route.
* Mongoose methods are asynchronous so use the await keyword to wait for the result before moving on to the next statement.
* If there is no article found then call the next() middleware function, passing in a 404 Not Found error. If there is an argument in next() Express treats it as an error object and passes it to the error handler middleware.
* If an article is found, render the articles/details template file. Pass it the article object.
* The details function is in a try/catch block. If there is an error, other than the 404, the catch block will catch it and pass it to next(err).

### Detail View
* See the views/articles/detail.ejs file for the HTML and EJS code.
* It includes links to the edit and delete forms.

---
## 3&4.3) Create Routes, Controller Functions, Form View
## GET Request: Display Form
* User clicks the link to the Create Article form (a GET request):
### Route: 
``` JavaScript
router.get('/create', createForm);
```
### Controller Callback Function:
``` JavaScript
// GET /articles/create
function createView(req, res, next) {
  res.render('articles/create', { title: 'Create Article' });
};
```
* User fills out form and hits the submit button (a POST request with form data):
## POST Request: Process Form
### Route: 
``` JavaScript
router.post('/create', validateForm(), create);
```
### Controller Callback Function:
``` JavaScript
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
```
* The first few statements handle form submissions that fail the validation middleware.
  * The validation errors are returned as an object. Assign it to an errors variable.
  * Re-render the create form. Pass back in the title, the values submitted in the form, and the errors object.
* If the validations pass then save the form data to the database.
  * As a security step, extract the specific fields from the request body (i.e., the form data).
    * If all fields are allowed then you can just use: const formData = req.body;
  * Chain the Mongoose create() method to the Article model. 
  * Mongoose methods that interact with the database are asynchronous. 
    * As such the whole controller function needs to be prefaced with async.
    * And this method needs to be prefaced with await so that the transaction completes before moving to the next statement.
* After the article record is created in the database, redirect to the article detail page.

---
## 3&4.4) Update Routes, Controller Functions, Form View
## GET Request: Display Form
* The article detail page has an Edit button with a link to the Update form.
``` html
<a href="/articles/<%= article.id %>/update">Edit</a>
```
### Route: 
``` JavaScript
router.get('/:id/update', updateForm);
```
### Controller Callback Function:
``` js
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
```
* User fills out form and hits the submit button (a POST request with form data):

## POST Request: Process Form
### Route: 
``` JavaScript
router.post('/:id/update', validateForm(), update);
```
* ValidateForm() is a middleware function we will populate later.

### Controller Callback Function:
``` js
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
```
* The first statement are to handle validation errors.
  * If the validation middleware returns any errors then re-render the update form.
  * Pass back the title, the form data that was submitted, and an array of errors.
* If the validations pass then save the form data to the database.
  * As a security step, extract the specific fields from the request body (i.e., the form data).
    * If all fields are allowed then you can just use: const formData = req.body;
  * Post the updates to the database.
* Redirect to the article detail page.

---
## 3&4.5) Delete Routes, Controller Functions, Form View
## GET Request: Display Form
* The article update page has a Delete button with a link to the Delete form.
``` html
<a href="/articles/<%= article.id %>/delete">Delete</a>
```
### Route: 
``` JavaScript
router.get('/:id/delete', deleteForm);
```
### Controller Callback Function:
``` js
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
```
* User confirms they really do want to delete this article and clicks Confirm delete.
* This is actually a form that submits a POST request.

### Delete Form
* See the views/articles/delete.ejs file for the HTML and EJS code.
* The form just has one hidden field for id.

## POST Request: Process Form
### Route: 
``` JavaScript
router.post('/:id/delete', delete);
```
### Controller Callback Function:
``` js
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
```

---
## Validation and Sanitation
* Ref: [express-validator.github.io/docs]('https://express-validator.github.io/docs/')
* We installed and imported the express-validator package.
* Fill out the placeholder validator array. 
* We put it inside a function and called the function as middleware in the route. By placing the validator array in a function, we can put it after the router functions. JavaScript functions are hoisted to the top of the module, while variables are not.
``` js
const { body, validationResult } = require('express-validator');
...
// Routes with validation middleware
router.post('/create', auth.isLoggedIn, validateForm(), create);
router.post('/:id/update', validateForm(), update);
...
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
* Each item in the array is a validator for a form field.
* You can chain multiple validator methods on the same field.
* Validation means checking that requirements are met such as minimum length.
* Sanitization involves modifying the data before saving it such as trimming leading and trailing spaces, or downcasing email addresses.