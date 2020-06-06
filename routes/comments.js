var express = require("express"),
    router  = express.Router({mergeParams : true}),
    Comment = require("../models/comment"),
    Campground = require("../models/campground");
let {isLoggedIn, checkCommentOwnership, isPaid, checkCommentExistance} = require("../middleware");

router.use(isLoggedIn, isPaid); //Check on every single route over here, if you are logged in and you have paid
//===================
//COMMENTS
//===================
//Show all comments

router.get("/", function(req, res){
  Campground.findOne({slug: req.params.slug}).populate("comments").exec(function(err, foundCamp){
    if(err){
      req.flash("error", err.message);
      res.redirect('back');
    }
    res.render("comments/index", {campground: foundCamp});
  })
})
//New Route Comment
router.get("/new", checkCommentExistance,function(req, res){
  Campground.findOne({slug: req.params.slug}, function(err, foundcamp){
    if(err)
      console.log(err);
    else{
      res.render("comments/new", {campground:foundcamp});
    }
  });
});
//Create Route Comment
router.post("/", checkCommentExistance,function(req, res){
  Campground.findOne({slug: req.params.slug}, function(err, foundcamp){
    if(err){
      console.log(err);
      res.redirect("/campgrounds")
    }
    Comment.create(req.body.comment, function(err, comment){
      if(err){
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("/campgrounds/" + foundcamp.slug);
      }
      else{
        //add user name and id to the comment
        //isLoggedIn ensures that someone is logged in, so we can use req.user
        comment.author.id = req.user._id;
        comment.author.username = req.user.username;
        comment.save();
        foundcamp.comments.push(comment);
        foundcamp.rating = calculateAverage(foundcamp.comments);
        foundcamp.save(function(err){
          if(err){
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("/campgrounds/" + req.params.slug);
          }
          else{
            req.flash("success", "Successfully added comment!");
            res.redirect("/campgrounds/" + req.params.slug);
          }
        })
      }
    });
    
  });
});

//EDIT route
router.get("/:comment_id/edit", checkCommentOwnership, function(req, res){
  Comment.findById(req.params.comment_id, function(err, foundComment){
    if(err)
      res.redirect("/campgrounds/" + req.params.slug);
    res.render("comments/edit", {comment:foundComment, campground_slug:req.params.slug});
  });
});

//Update Route
router.put("/:comment_id", checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
    if(err){
      req.flash("error", err.message);
      res.redirect("/campgrounds/" + req.params.slug);
    }
    Campground.findOne({slug: req.params.slug}).populate("comments").exec(function (err, campground) {
      if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
      }
      // recalculate campground average
      campground.rating = calculateAverage(campground.comments);
      //save changes
      campground.save();
      req.flash("success", "Your review was successfully edited.");
      res.redirect('/campgrounds/' + campground.slug);
    });
  });
});

//Delete Route
router.delete("/:comment_id", checkCommentOwnership, function(req, res){
  Comment.findByIdAndDelete(req.params.comment_id, function(err, deleteCamp){
    if(err){
      console.log(err);
      res.redirect("back");
    }
    Campground.findByOneAndUpdate({slug: req.params.slug}, {$pull: {comment: req.params.comment_id}}, {new: true}).populate("comments").exec(function (err, campground) {
      if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
      }
      // recalculate campground average
      campground.rating = calculateAverage(campground.comments);
      //save changes
      campground.save();
      req.flash("success", "Your review was deleted successfully.");
      res.redirect("/campgrounds/" + req.params.slug);
    });
  });
});

module.exports = router;

function calculateAverage(comments) {
  if (comments.length === 0) {
      return 0;
  }
  var sum = 0;
  comments.forEach(function (element) {
      sum += element.rating;
  });
  return sum / comments.length;
}