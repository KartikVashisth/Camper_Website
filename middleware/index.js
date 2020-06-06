//all middleware goes here
var Campground = require("../models/campground"),
Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    Campground.findOne({slug: req.params.slug}, function(err, foundCamp){
      if(err){
        req.flash("error", "Campground not found");
        res.redirect("back");
      }
      else{
        //does user own the campground
        //If yes, move on to rest of the code and delete, update or edit.
        if(foundCamp.author.id.equals(req.user._id) || req.user.admin_user)
          next();
        else{
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      } 
    });
  }
  else{
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("back");
  }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err)
        res.redirect("back");
      else{
        if(foundComment.author.id.equals(req.user._id) || req.user.admin_user)
          return next();
        else{
          req.flash("error", "You don't have permission to do that!");
          res.redirect("back");
        }        
      }
    });
  }
  else{
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("back");
  }
};

middlewareObj.checkCommentExistance = function(req, res, next){
  if(req.isAuthenticated()){
    Campground.findOne({slug: req.params.slug}).populate("comments").exec(function(err, camp){
      if(err){
        req.flash("error", "Campground not found.");
        res.redirect("back");
      }
      var isPresent = camp.comments.some(function(element){
        return element.author.id.equals(req.user._id);
      });
      if(isPresent){
        req.flash("error", "You already wrote a review");
        res.redirect("/campgrounds/" + req.params.slug);
      }
      return next();
    })
  }
  else {
    req.flash("error", "You need to login first.");
    res.redirect("back");
  }
}

middlewareObj.isLoggedIn = function(req, res, next){
  if(req.isAuthenticated())
    return next();
  //eval(require('locus'));
  //We know that request came from that particular fetch for which we have
  //defined conten-type=application/json
  if(req['headers']['content-type'] === 'application/json'){
    return res.send({error: "Login Required"});
  }
  req.flash("error", "You need to be logged in to do that!");
  res.redirect("/login");
};

middlewareObj.isPaid = function(req, res, next){
  if(req.user.isPaid || req.user.admin_user)
    return next();

  req.flash("error", "Please pay your registration fee before continuing");
  res.redirect("/checkout");
};

module.exports = middlewareObj;