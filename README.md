# Node.js with MongoDB Basic Web Application Example and Tutorial
## Overview
### Stack: 
* Node.js runtime environment and JavaScript programming language.
* Express MVC web framework with EJS templating engine.
* Mongoose ODM with MongoDB database. Validations with Express Validator.
* Bootstrap for basic styling.

### Purpose:
* This app is meant to be used as a base app for practice or production applications.  
* Use it as the starting point for building apps. Just copy it and change the name in package.json
* Use it as is, or modify it to your tastes.

### What it includes:
* Basic pages for home, about, and errors.
* An articles collection. Many sites include a blog, which this can be used for.
* A User Authentication and Authorization system.
* Bootstrap for styling. 

### To Use This App:
* You must have Node.js installed.
* This app assumes you have MongoDB installed on your machine. 
  * If you prefer to use a cloud account you must modify the code in the app.js file before running the app.
* Download this repository.
* Change the .env.example file name to just .env
* Go to project folder in the Terminal and install all dependencies: `npm install`
* In a separate Terminal window start MongoDB: `mongod`
* Run app: `npm start` or if you have nodemon installed globally: `nodemon`
* View it in the browser at URL: `http://localhost:3000`

### Instructions for how to build a Node.js with MongoDB Base app:
* The docs folder contains the instructions for how this app was built. It is broken into sections.
* The first two sections have a corresponding YouTube tutorial series found at: https://www.youtube.com/playlist?list=PLc_Hd5ZLCxMHgIgRLikj7bvINeVIq6KmL
* A cheatsheet, and the CheatSheet Desktop App are available at: https://www.learnbycheating.com
1. [Basic Node.js app setup](./docs/1-setup.md)
1. [Node.js collection with Mongoose ODM](./docs/2-collection.md)
1. [Node.js collection API with Mongoose ODM](./docs/3-collection-api.md)
1. [Node.js User authentication system](./docs/4-authentication.md)
1. [Node.js Associate User with Article](./docs/5-user-associations.md)