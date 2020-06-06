var mongoose = require("mongoose");
//Schema setup
var campgroundSchema = new mongoose.Schema({
  name : {
    type: String,
    required: 'Campground cannot be blank.'
  },
  price : String,
  image : String,
  description : String,
  longitude: Number,
  latitude: Number,
  author : {
    id : {
      type : mongoose.Schema.Types.ObjectId,
      ref : "User"
    },
    username : String
  },
  comments : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "Comment"
  }],
  slug: {
    type: String,
    unique: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    type: Number,
    default: 0
  }
});

campgroundSchema.pre('save', async function(next) {
  try{
    if(this.isNew || this.isModified("name")){
      this.slug = await generateUniqueSlug(this._id, this.name);
    }
    next();
  }catch(err){
    next(err);
  }
});

var Campground = mongoose.model("Campground", campgroundSchema);
module.exports = Campground;

async function generateUniqueSlug(id, campgroundName, slug){
  try{
    if(!slug){
      slug = slugify(campgroundName);
    }
    let camp = await Campground.findOne({slug: slug});
    if(!camp || camp._id.equals(id)){
      return slug;
    }
    //If not unique slug
    var newSlug = slugify(campgroundName);
    //Check again by calling the function recursively
    return await generateUniqueSlug(id, campgroundName, newSlug);
  }catch(err){
    throw new Error(err);
  }
}
//Function for creating slug
function slugify(text) {
  var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
  return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}