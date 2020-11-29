# Install MongoDB or get Cloud Account

<h2 id='mongo'>MongoDB database</h2>
<p>MongoDB is a noSQL database. If you've only dealt with relational databases like PostgreSQL, MySQL, SQLite, etc., it's a different way of thinking about it. This tutorial won't get into how noSQL works. There are plenty of other resources for that such as <a href="https://www.mongodb.com/nosql-explained">mongodb.com/nosql-explained</a>. Don't worry if you've never used it before, you can continue with this tutorial without a problem.</p>
<p>MongoDB offers a cloud database called Atlas, or you can download the "community version" on your local machine. You may have read about another popular cloud solution called mlabs, but they were bought by MongoDB and are no longer accepting new accounts. Which to use? I generally prefer a local version to work with in development. Sometimes there are connection issues with a cloud version (which I ran into). But if you deploy your app to Heroku then you need a cloud solution. I will explain both ways.</p>
<p>Quick terminology for those used to relational databases. "Collections" are like tables in a relational database and "documents" are like records. </p>
<p>Also, don't worry about creating the collections. Once you create the database and connect to it, MongoDB will automatically create a collection for you when you save a document to a collection that doesn't exist yet.</p>

<h4>Option 1) MongoDB Atlas</h4>
<p>At the time of this writing you can set up a free account for a small project like this one at <a href="https://www.mongodb.com/cloud/atlas">mongodb.com/cloud/atlas</a>. It is very fast and straight-forward to set up. Just follow their steps, but note a few things:</p>
<ul>
  <li>It will ask you for a name and password for the project. You will use these to access the database.</li>
  <li>In one of the steps they will ask you to whitelist the IP addresses that will be accessing your database. For a practice app like this just click on "add IP" and select the "Allow access from anywhere" option.</li>
  <li>Skip seeding the database.</li>
  <li>For the last step you select a connect option. We want the "Connect your application" option. That will provide you with a link to add to your application. Something like <code>mongodb+srv://<i>user</i>:<i>password</i>@<i>cluster-number</i>.mongodb.net/test?retryWrites=true&w=majority</code>. Copy this and paste it into the server.js file (which we'll cover next).</li>
</ul>

<h5>Option 2) MongoDB local "community" version</h5>
<p>I'm on a Mac so I'll explain briefly how to load the MongoDB community version on a Mac using Homebrew. If you are on windows, installation instructions are at <a href="https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/">docs.mongodb.com/manual/tutorial/install-mongodb-on-windows</a>.
<p class='mb-1'>To see if MongoDB is installed on your machine with Homebrew run:</p>
<li class="dlr"><code>brew list mongodb</code> or <code>brew search mongodb</code></li></p>
<p class='my-1'>If it's installed it will show the path of any MongoDB executable files (there are several). If it's not installed run:</p>
<li class="dlr"><code>brew install mongodb</code></li>
<p class='mt-3 mb-1'>Now set up the directory where the database is stored. MongoDB expects you to use data/db so we'll go with that:</p>
<li class="dlr"><code>sudo mkdir -p data/db</code></li>
<p class='my-1'>And set the owner of this directory to yourself. </p>
<li class="dlr"><code>sudo chown -R $(whoami) data/db</code></li>
<p class='my-1'>Sudo means Super User Do. You need that for commands that require super user permissions like messing around with you Mac's root directory. Chown means change owner. The -R flag makes this recursive meaning it changes the owner of all the files and folders in the directory. $(whoami) runs the UNIX whoami command to get your username on your computer.</p>
<p class='mt-3 mb-1'>If MongoDB was already installed you can check to see if the version is outdated.</p>
<li class="dlr"><code>brew outdated mongodb</code></li>
<p class='my-1'>This will return your version compared to the latest version if they differ. If it returns nothing then you have the latest version. You can upgrade the MongoDB version with:</p>
<li class="dlr"><code>brew upgrade mongodb</code></li>

<h5 class='mt-4'>Run MongoDB</h5>
<p class='mb-1'>Once it's installed you run MongoDB from the terminal (from any directory) and have to leave that window open and running to access the database:</p>
<li class="dlr"><code>mongod</code></li>
<p class='mt-1'>Stop MongoDB from the same terminal window with CTRL+C.</p>

<h5 class='mt-4'>MongoDB Shell</h5>
<p class='mb-1'>You can interact with the database directly using the MongoDB shell from the Terminal. There are also GUI tools like Robo T3 if you prefer that but frankly for small projects I find the command line easier to work with. To use the shell from anywhere in the terminal run:</p>
<li class='dlr'><code>mongo</code></li>
<p class='mt-3 mb-1'>The list of MongoDB commands are at <a href="https://docs.mongodb.com/manual/reference/mongo-shell/">docs.mongodb.com/manual/reference/mongo-shell</a> and <a href="https://docs.mongodb.com/manual/crud/#read-operations">CRUD Operations</a>. Useful commands include:</p>
<li class='dlr'><code>show dbs</code> - Returns a list of your databases.</li>
<li class='dlr'><code>use <i>my_local_db</i></code> - Use the specified database. Creates it if it doesn't exist.</li>
<li class='dlr'><code>db</code> - Returns the db you are currently in.</li>
<li class='dlr'><code>show collections</code> - Returns the collections in the db you are currently in. Collections are like tables in an SQL database.</li>
<li class='dlr'><code>db.createCollection("<i>articles</i>")</code> - Create a collection.</li>
<li class='dlr'><code>db.<i>articles</i>.find()</code> - Show all documents in the collection. Documents are like records in an SQL database.</li>
<li class='dlr'><code>db.<i>articles</i>.insertOne( { <i>title</i>: <i>"Learn MongoDB"</i>, <i>content</i>: <i>"Lorem Ipsum."</i> } )</code> - Insert a document into a collection. Must use double quotes for a string.</li>
<li class='dlr'><code>db.<i>articles</i>.find({<i>title</i>: "<i>Learn MongoDB</i>"})</code> - Returns all that match the condition.</li>
<li class='dlr'><code>db.<i>articles</i>.findOne({<i>title</i>: "<i>Learn MongoDB</i>"})</code> - Returns the first document that matches the condition.</li>
<li class='dlr'><code>db.articles.findOne({"_id" : ObjectId("<i>id-string-here</i>")});</code> - Find by id.</li>
<li class='dlr'><code>db.articles.updateOne({title:"Learn MongoDB"},{ $set: {content:"Blah Blah."}})</code> - Updates a specific field in a document. Adds document if it doesn't exist. Use updateMany() for multiple.
<li class='dlr'><code>db.articles.update({"_id" : ObjectId("<i>id-string-here</i>")},{ $set: {content:"Blah Blah Blah!"}})</code> - Find by ID then update.
<li class='dlr'><code>db.<i>articles</i>.deleteOne( { <i>title</i>: <i>"Learn MongoDB"</i> })</code> - Remove one document by non-id field. Use deleteMany() for multiple.</li>
<li class='dlr'><code>db.<i>articles</i>.deleteOne( { "_id": ObjectId("<i>value</i>") })</code> - Remove by id.</li>
<li class='dlr'><code>db.dropDatabase()</code> - Deletes the db you are currently in.</li>
