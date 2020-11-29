# Setup a Node.js with MongoDB App from scratch
* These are the instructions that were used to create the initial structure of this app. 
* You can recreate it by following these instructions.
* Assumes you have node.js installed on your computer and are familiar with the basic UNIX CLI commands.
* If you do not already have MongoDB installed locally, see the instructions on installing or setting up a cloud account: [MongoDB local/cloud](./1b-mongo.md)

---
## Generate an app and install dependencies
* Use express-generator to: 
  * Create an app skeleton;
  * Change directories into the project folder;
  * Install the dependencies;
  * And add dotenv package for environmental variables.
  * Add express-session and express-flash to enable flash.
  * Add mongoose, the most popular Object Document Mapping (ODM) package for MongoDB.

```
npx express-generator node-baseapp --view=ejs --git
cd node-baseapp
npm install
npm install dotenv express-session express-flash mongoose
```

---
## Make some modifications to the file structure
* Most of the generated file structure will stay as is.
* Changes: 
  * Add view folders and files for layouts and general pages.
  * Move the index and error pages to the pages folder. Rename index to home.
  * Add .env file to hold environmental variables.

```
mkdir views/layouts
touch views/layouts/header.ejs
touch views/layouts/footer.ejs
mkdir views/pages
touch views/pages/about.ejs
mv views/index.ejs views/pages/home.ejs
mv views/error.ejs views/pages/error.ejs
touch .env
```

---
## Environmental Variables
* The .env file sets environmental variables that can be used throughout the app.
* The variables are added to Node's process.env object.
* If you want to run the app on a port other than 3000, set the PORT property: `PORT=3000` to 3001 or some other number.
* To use express-sessions you need to add a SECRET property: `SECRET=mysecret`
* Set the MongoDB URL and database name: `MONGODB_URI=mongodb://localhost:27017/my_local_db`
* Make sure the .env file is in your .gitignore file so you don't expose any sensitive data. To see what the .env file should look like, see the .env.example file.

---
## The bin/www.js file 
* Express-generator generated the bin/www.js file. This is the file that launches the application.
* We won't make any changes to this file.
* This file uses the Node.js http module to create a server.
* It looks for an environmental variable to determine the port and defauls to 3000. The listen method listens for HTTP requests.
* It imports the app.js file which is where we'll create the express app, add our middleware, and launch the database.

---
## The app.js file 
* This file is where we create the express app, add our middleware, and launch the database.
* Express-generator populated the app.js file but we need to make some changes to reflect the modifications to the file structure and the npm packages we added.
* The required changes include: 
  * Change the variable declarations from var to const.
  * Add imports for the session, flash and environmental variables packages we installed.
  * Log the port that the app is listening on.
  * Add middleware for session and flash.
  * Connect to MongoDB.
  * Change the location of the error.ejs file since we moved it to the pages folder.

#### **`app.js`**
``` js
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('express-flash');
const mongoose = require('mongoose');
require('dotenv').config(); 

// Load the routers
const indexRouter = require('./routes/index');

console.log("Listening on port " + process.env.PORT);

// Calling express() will instantiate an express app object. 
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Chain Express and 3rd Party middleware layers to the app.
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: process.env.SECRET, saveUninitialized: true, resave: false }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// Router middleware
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('pages/error');
});

// Connect to the MongoDB database
mongoose.connect(
  process.env.MONGODB_URI, 
  { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, 
    useUnifiedTopology: true }
); 
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => { console.log('Connected to the Database.') });

module.exports = app;
```
Explanation:
<ul>
<li>Start by importing our express and mongoose packages and our Express router which we'll define shortly.</li>
<li>Calling the express() function will create our running app object.</li>
<li>Chaining Express's <a href="http://expressjs.com/en/api.html#app.use">use method</a> to our app object gives us access to the libraries we imported. <code><a href="http://expressjs.com/en/api.html#express.urlencoded">express.urlencoded({ extended: true })</a></code> and <code><a href="http://expressjs.com/en/5x/api.html#express.json">express.json()</a></code> are middleware for parsing requests with JSON payloads (for POST and PATCH/PUT requests).</li>
<li>Router middleware applies the router when an HTTP request is made to the url path in the first argument. In this case '/' is the root path of our app.</li>
<li><code>mongoose.connect()</code> connects to our MongoDB database</li>
<li>Optionally, log a message if the above connection was successful and one if it is not.</li>
<li>Define error handling middleware. First to handle 404 page not found errors. Then to handle general errors. This will display an error page.
</ul>


---
## Routes and Controller Functions
* Change the routes file.
  * This file is a module that is imported into the app.js file. 
    * It contains all the app's routes. 
    * The Route callback functions are contained in the controller file(s).
  * Import Express and generate a Router instance.
  * Import the pagesController.
  * Add routes related to the pages controller to the router instance. Specifically, GET requests for the home and about pages.
  * The route's callback/handler functions process the HTTP request and return a response back to the client. In the Model-View-Controller design pattern, these are the controller functions.
  * The the home and about controller functions render the specified HTML templates in the views/pages folder. 
  * They also pass an object to the template for a property for title.
  * You can define the controller functions in one of three places: 
    * Directly in the router method itself.
    * Below the router methods (we'll do this).
    * In a separate controller file and import it into the reouter file.

#### **`routes/index.js`**
``` js
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
```

---
## Views 
### Layout
* The views/layouts folder contains files for the header and footer. These are called partials because they only contain a partial page. 
* They are included in the other HTML template files.
* The header.ejs file contains the navigation bar and displays flash messages.
* There is also a partial for form-errors that is included in form template files.

### Bootstrap
* Bootstrap is a popular styling framework that includes both CSS and JavaScript files. It also requires jQuery and Popper.js.
* For practice apps, to avoid loading these files for every app you can use the CDN version from https://getbootstrap.com. Just be aware it will only load with a working internet connection. 
* For production apps you can use the CDN or install the npm packages: npm install bootstrap jquery popper.js. In this app we are using the CDN.
* The bootstrap CSS link is in the views/layouts/header.ejs partial.
* The Bootstrap, jQuery, and Popper.js CDN links are in the footer.ejs partial.

### Home and About pages
* The views/pages folder contains the view templates for the pages templates - home and about.

---
## Run the App
* Start the MongoDB database. Open a terminal window and enter command: `mongod`
* Run the start script in the package.json file with:
`npm start`
* View the app in the browser at:
`http://localhost:3000`

---
Next add an Articles Collection: [2-Collection](./2-collection.md)
