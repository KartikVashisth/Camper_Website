var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  text : String,
  author : {
    username : String,
    id : {
      type : mongoose.Schema.Types.ObjectId,
      ref : "User"
    }
  },
  created : {type : Date, default : Date.now},
  rating: {
    // Setting the field type
    type: Number,
    // Making the star rating required
    required: "Please provide a rating (1-5 stars).",
    // Defining min and max values
    min: 1,
    max: 5,
    // Adding validation to see if the entry is an integer
    validate: {
        // validator accepts a function definition which it uses for validation
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value."
    }
  }
}, {
  // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
  timestamps: true
});
var Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;