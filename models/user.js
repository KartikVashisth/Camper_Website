var mongoose          = require("mongoose"), 
passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
  password : String,
  username : String,
  isPaid: { type: Boolean, default: false},
  admin_user: {type: Boolean, default: false},
  avatar: String,
  first_name: String,
  last_name: String,
  email: {type: String, unique: true, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);