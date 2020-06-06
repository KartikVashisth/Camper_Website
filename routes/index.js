var express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    Campground = require('../models/campground'),
    Notification = require('../models/notification')
    passport = require("passport"),
    middleware = require("../middleware"),
    expressSanitizer = require("express-sanitizer"),
    async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
router.use(expressSanitizer());
//=====================
//AUTHENTICATION ROUTES
//=====================
//root route
router.get("/", function(req, res){
  res.render("landing")
});
//Signup
router.get("/register", function(req, res){
  res.render("users/register", {page: "register"});
});
router.post("/register", function(req, res){
  var admin_user = false;
  if(req.body.admin_code == process.env.ADMIN_CODE)
    admin_user = true;
  curr_user = new User({
    username: req.body.username,
    avatar: req.body.avatar,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    admin_user: admin_user
  })
  User.register(curr_user, req.body.password, function(err, user){
    if(err){
      //console.log(err)
      req.flash("error", err.message);
      res.redirect("/register");//, {error : err.message});
    }
    passport.authenticate("local")(req, res, function(){
      req.flash("success", "Successfully Registered " + user.username);
      if(req.user.admin_user)
        res.redirect('/campgrounds');
      res.redirect("/checkout");
    });
  });
});

//Login
router.get("/login", function(req, res){
  res.render("users/login", {page : "login"});
})
//Using passport.authenticate on Local Strategy could have been(Facebook, Twitter etc. strategy)
//User is presumed to exist already so we use passport.authenticate
router.post("/login", passport.authenticate("local", {
  successRedirect : "/campgrounds",
  failureRedirect : "/login"
}), function(req, res){
});

//Logout
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "Logged You Out!");
  res.redirect("/");
});

//==============
//User profiles
//==============
router.get("/users/:id", middleware.isLoggedIn, function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "Something went wrong");
      res.redirect('/campgrounds');
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, camps){
      if(err){
        req.flash("error", "Something went wrong");
        res.redirect('/campgrounds');
      }
      res.render('users/profile', {user:foundUser, camps: camps});
    })
  })
});
//Follow User
router.get('/follow/:id', middleware.isLoggedIn, async (req, res) => {
  try{
    let user = await User.findById(req.params.id);
    for(const id1 in user.followers){
      if(id1.equals(req.user._id)){
        req.flash('error', 'You are already following ' + user.username);
        res.redirect('back');
      }
    }
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'You are now following ' + user.username);
    res.redirect('/users/' + req.params.id);
  }
  catch(err){
    req.flash('error', 'You are already following this person');
    res.redirect('back');
  }
});
//Notification Page
router.get('/notifications', middleware.isLoggedIn, async (req, res) => {
  try{
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: {sort: {"_id" : -1}}
    }).exec();
    res.render('users/notification', {all_notifications: user.notifications});
  }catch(err){
    req.flash('error', err.message);
    res.redirect('back');
  }
});
//Handle Notification
router.get('/notifications/:id', middleware.isLoggedIn, async (req, res) => {
  try{
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/campgrounds/${notification.campgroundSlug}`);
  }catch(err){
    req.flash('error', err.message);
    res.redirect('back');
  }
  
})

//=========================================
//Reset Password
//=========================================

router.get('/forgot', function(req, res){
  res.render('users/forgot');
});

router.post('/forgot', function(req, res, next){
  //array of functions called one after the another 
  async.waterfall([
    function(done){
      crypto.randomBytes(20, function(err, buf){
        token = buf.toString('hex')
        done(err, token); //token created here will be sent as part of url to users email-address
      });
    },
    function(token, done){
      User.findOne({email: req.body.email}, function(err, user){
        //If no user returned
        if(!user){
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; //1 hour
        user.save(function(err){
          done(err, token, user);
        });
      });
    },
    function(token, user, done){
      //Information about mailer service
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'kartikvashisth25@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kartikvashisth25@gmail.com',
        subject: 'Password Reset for camping account',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err){
        console.log('email sent');
        req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err){
    if(err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res){
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
    if(!user){
      req.flash('error', 'Password Reset Token is invalid or has expired');
      return res.redirect('back');
    }
    res.render('users/reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res){
  async.waterfall([
    function(done){
      User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
        if(!user){
          req.flash('error', 'Password Reset Token is invalid or has expired');
          return res.redirect('back');
        }
        if(req.body.new_p === req.body.confirm_p){
          user.setPassword(req.body.new_p, function(err){
            resetPasswordToken = undefined;
            resetPasswordExpires = undefined;
            user.save(function(err){
              //Logs the user in
              req.logIn(user, function(err){
                done(err, user);
              });
            });
          });
        }
        else{
          req.flash('error', 'Password do not match.');
          return res.redirect('back');
        }
      });
    },
    function(user, done){
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'kartikvashisth25@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kartikvashisth25@gmail.com',
        subject: 'Password Changes',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      }
      smtpTransport.sendMail(mailOptions, function(err){
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      })
    }
  ], function(err){
    res.redirect('/campgrounds');
  });
});


//=========================================
//Stripe Payment Routes
//=========================================
//Checkout
router.get('/checkout', middleware.isLoggedIn,(req, res) => {
    if(req.user.isPaid){
      req.flash("success", "You have already Paid!");
      res.redirect("/campgrounds");
    }
    res.render('checkout', {amount: 20});
  
});

//POST pay
router.post("/pay", middleware.isLoggedIn, async (req, res) => {
  //pull those properties from the body assign them to these variables
  const { paymentMethodId, items, currency } = req.body;

  const amount = 2000;

  try {
    // Create new PaymentIntent with a PaymentMethod ID from the client.
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      error_on_requires_action: true,
      confirm: true
    });

    console.log("💰 Payment received!");
    req.user.isPaid = true;
    await req.user.save();
    // The payment is complete and the money has been moved
    // You can add any post-payment code here (e.g. shipping, fulfillment, etc)

    // Send the client secret to the client to use in the demo
    res.send({ clientSecret: intent.client_secret });
  } catch (e) {
    // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
    // See https://stripe.com/docs/declines/codes for more
    if (e.code === "authentication_required") {
      res.send({
        error:
          "This card requires authentication in order to proceeded. Please use a different card."
      });
    } else {
      res.send({ error: e.message });
    }
  }
});

//======================================
//Email using SendGrid
//======================================
//GET contact
router.get("/contact", middleware.isLoggedIn, (req, res) => {
  res.render("users/contact", {page:'contact'});
});

//async function allows us to use async await 
//keywords and promises
router.post("/contact", middleware.isLoggedIn, async(req, res) => {
  let {name, email, message} = req.body;
  message = req.sanitize(message);
  email = req.sanitize(email);
  name = req.sanitize(name);
  const msg = {
    to: 'kartikvashisth25@gmail.com',
    from: email,
    subject: `YelpCamp Contact Form Submission from ${name}`,
    text: message,
    html: `<strong>${message}</strong>`,
  };
  try {
    await sgMail.send(msg)
    req.flash('success', 'Thank you for your email, will respond to this soon');
    res.redirect('/');
    /*
    Alternate(Old way)
    sgMail.send(msg, function(err){
      if(err)
        //handle error
      else
        //Flash success message and redirect
    });
    */
  } catch (error) {
    console.error(error);
 
    if (error.response) {
      console.error(error.response.body)
    }
    req.flash("error", "Sorry, something went wrong, please contact admin@kartikvashisth25@gmail.com");
    res.redirect('back');
  }
});

module.exports = router;