# Authentication and Authorization - Pt 2 <!-- omit in toc -->
## Table of Contents <!-- omit in toc -->

## Email
* In this part we will be using email, or simulate using email.
* There are multiple email providers you can choose from. This type of email is called transactional, as opposed to email marketing. Sendgrid is a leading provider of transactional email and offers a free account of up to 100 emails/day.
* You don't have to have an account to follow along. You can use the sendgrid package but just print the email to your terminal without even connecting to sendgrid.
* We'll also install the crypto-random-string package to generate a unique token to use when sending the activation email.
* Ref: 
  * Sendgrid Home Page: [sendgrid.com/](https://sendgrid.com/)
  * @sendgrid/mail NPM Package docs: [npmjs.com/package/@sendgrid/mail](https://www.npmjs.com/package/@sendgrid/mail)
  * Crypto-random-string Package docs: [https://github.com/sindresorhus/crypto-random-string#readme](github.com/sindresorhus/crypto-random-string)

* Install the required packages: `npm install @sendgrid/mail crypto-random-string`

## Account Activation
* In part 1 of this tutorial we created the signup route and controller function to sign up a new users.
* To avoid bots creating accounts with fake email addresses add an account activation step.
* When a user registers we will send them an email with an activation link. They cannot use their account until the link is clicked.
* Add imports to the top of the auth routes file
* Then modify the signup controller function to send the account activation email instead of logging the user in.

#### `routes/auth.js`
``` js
const cryptoRandomString = require('crypto-random-string');
const sgMail = require('@sendgrid/mail');
const ejs = require('ejs');
...

async function signup(req, res, next) {
  const formData = { username, email } = req.body;  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { title: 'Signup', user: formData, errors: errors.array() });
  }
  try {
    // Encrypt the password for security
    formData.password = await bcrypt.hash(req.body.password, 10);
    // Generate an activation token to save to the DB.
    formData.activationToken = await cryptoRandomString({length: 10, type: 'url-safe'});
    const user = formData// await User.create(formData);
    // On success - send activation email.
    sendActivationEmail(user.username, user.email, user.activationToken);
    req.flash('info', 'Please check your email to activate your account.');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
}
// Helper function for signup action
async function sendActivationEmail(username, email, token) {
  const html = await ejs.renderFile(
    __dirname + "/../views/email/activate-account.ejs",
    {username: username, email: email, token: token }
  );
  const msg = {
    to: email,
    from: 'no-reply@example.com',
    subject: 'Account activation',
    html: html
  };
  try {
    // View email in the console without sending it.
    console.log('Activation Email: ', msg); 
    // Uncomment below to send the email.
    /*sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(msg);
    console.log('Email has been sent!');*/
  } catch(err) {
    console.log('There was an error sending the email. Error: ' + err);
  }
};
```

### Email Template

* Create an email views folder and add an activate-account template to it: `mkdir views/email; touch views/email/activate-account.ejs`
* Populate the template (see the file).
  * Include an activation link `<a href="http://localhost:3000/auth/activate-account?token=<%= token %>&email=<%= email %>">Activate</a>`
  * The link includes a query string token and email values.
  * Query strings are parameters passed in the url. Format: `?key1=value&key2=value`

### ActivateAccount Function
* When the user gets the email and clicks on the link, the route will call the activateAccount controller function.
* To test, create a user. The activation email will be logged in the console. Copy the url from the console and paste it in the browser.
* The email and token are in the query string at the end of the URL.
``` js
// GET /auth/activate-account
async function activateAccount(req, res, next) {
  if (!req.query.token || !req.query.email) {
    req.flash('warning', 'Token or email was not provided.');
    return res.redirect('/');
  }
  const user = await User.findOne({ email: req.query.email }); 
  if (!user || user.activationToken !== req.query.token) {
    req.flash('warning', 'Could not activate account.');
    return res.redirect('/');
  } 
  try {
    await User.findByIdAndUpdate(user._id, {activated: true});
    // On success - login user and redirect.
    const token = jwt.sign(
      { user: { id: user._id, username: user.username, role: user.role }}, 
      process.env.SECRET, 
      { expiresIn: '1y' }
    );
    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    req.flash('success', 'Your account is activated.');
    res.redirect(`/users/${user.id}`);
  } catch (err) {
    return next(err); 
  }
};
```
* Check that both a token and email are provided in the query string.
* Find the user in the DB by the email field.
* Compare the token in the query string to the user's activationToken in the DB.
* If they match, create a jwt token and add it to the response cookie.
* Redirect to the user profile page.

---
## Forgot Password
* There is a "Forgot Password" link on the log in page.
* See the views/auth/forgot-password.ejs file for the code.
* It is a form with just an email field.
* User enters their email and submits the form.
* If the email is found in the database, a token is generated and stored in the DB along with an expiration date and an email is sent.
* User clicks on the link and a password reset form opens.

### Forgot-password controller function
