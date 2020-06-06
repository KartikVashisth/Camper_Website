var express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    Notification = require('../models/notification'),
    User = require('../models/user')
    expressSanitizer = require("express-sanitizer");
let {isLoggedIn, checkCampgroundOwnership, isPaid} = require("../middleware");
router.use(expressSanitizer());
router.use(isLoggedIn, isPaid);

//=================
//CAMPGROUND Routes
//=================

//INDEX- display list of campgrounds
router.get("/", function(req, res){
  if(req.query.paid){
    res.locals.success = "Payment succeeded, welcome to yelpcamp";
  }
  var noMatch = '';
  //res.render("campgrounds",{campgrounds:campgrounds})
  //Get all the campgrounds from the database
  //and display it on campgrounds page
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    Campground.find({name : regex}, function(err, allcamps){
      if(err)
        console.log(err);
      else{
        //console.log(allcamps.length);
        if(allcamps.length < 1){
          noMatch = "No campground match your search, Try Again!";  
        }
        res.render("campgrounds/campgrounds", {campgrounds : allcamps, noMatch:noMatch, page: "campgrounds"});
      }
    });
  }
  else{
    Campground.find({}, function(err, allcamps){
      if(err)
        console.log(err);
      else
        res.render("campgrounds/campgrounds", {campgrounds : allcamps, noMatch: noMatch, page: "campgrounds"});
    });
  }
});
//Create - Add new campground to db
router.post("/", async (req, res) => {
  //Can create new campground
  //Take data from form and add to campground array, redirect back to campgrounds page
  //User should be logged in because of isLoggedIn
  const sanitized_desc = req.sanitize(req.body.description);
  var name = req.body.name;
  var image = req.body.image;
  var descp = sanitized_desc;
  var price = req.body.price;
  var long = req.body.longitude;
  var lat = req.body.latitude;
  var author = {
    id : req.user._id,
    username : req.user.username
  }
  var newCampground = {name:name, price:price, image:image, description:descp, author:author, longitude:long, latitude:lat};
  try{
    let campground = await Campground.create(newCampground);
    let user = await User.findById(req.user._id).populate('followers').exec();
    let newNotification = {
      username: req.user.username,
      campgroundSlug: campground.slug
    }
    for(const follower of user.followers){
      let notification = await Notification.create(newNotification);
      follower.notifications.push(notification);
      follower.save();
    }
    res.redirect('/campgrounds');
  }catch(err){
    if(err)
      req.flash('error', err.message);
      res.redirect('back');
  }
});

//New -  Displays form to add new campground
router.get("/new", function(req, res){
  res.render("campgrounds/new")
});

//SHOW-More info about single campground
router.get("/:slug", function(req, res){
  //Find campground with required id
  //Render show template with that campground
  Campground.findOne({slug: req.params.slug}).populate({
    path: "comments",
    options: {sort: {createdAt: -1}}
  }).populate("likes").exec(function(err, foundcamp){
    if(err)
      console.log(err)
    else{
      //render show template with that campground\
      //console.log(foundcamp);
      res.render("campgrounds/show", {campground : foundcamp})
    }
  });
});

//Likes Route
router.post('/:slug/like', async (req, res) => {
  try{
    let foundCamp = await Campground.findOne({slug: req.params.slug});
    let foundUserLike = await foundCamp.likes.some(function(like){
      return like.equals(req.user._id);
    }); 
    if(foundUserLike){
      foundCamp.likes.pull(req.user._id);
    }
    else{
      foundCamp.likes.push(req.user);
    }
    foundCamp.save();
    res.redirect('/campgrounds/' + req.params.slug);
  }catch(err){
    req.flash('error', err.message);
    res.redirect('/campgrounds');
  }
})

//Edit Campground
router.get("/:slug/edit" , checkCampgroundOwnership, function(req, res){
  Campground.findOne({slug: req.params.slug}, function(err, foundCamp){
      res.render("campgrounds/edit", {campground:foundCamp});
  });
});

//Update Campground
router.put("/:slug", checkCampgroundOwnership, function(req, res){
  req.body.camp_ground.body = req.sanitize(req.body.camp_ground.body);
  Campground.findOneAndUpdate({slug: req.params.slug}, req.body.camp_ground, function(err, updateCampground){
    if(err)
      res.redirect("/campgrounds");
    else
      res.redirect("/campgrounds/" + req.params.slug);
  });
});

//delete routes
router.delete("/:slug", checkCampgroundOwnership, function(req, res){
  Campground.findOneAndRemove({slug: req.params.slug}, function(err, deleteCamp){
    if(err)
      res.redirect("/campgrounds/" + req.params.slug);
    Comment.deleteMany( {_id: { $in: deleteCamp.comments } }, (err)=>{
      if (err) {
          console.log(err);
      }
      res.redirect("/campgrounds");
    });
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
module.exports = router;
