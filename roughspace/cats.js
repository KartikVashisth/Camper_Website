var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/cat_app");
//adding new item to the database
//retrieve all items and console.log each one

var catSchema = new mongoose.Schema({
  name : String,
  age : Number,
  temperament : String 
});

var Cat = mongoose.model("Cat", catSchema);

//adding a new cat to the database
/*
var george = new Cat({
  name : "Mrs Norris",
  age : 7,
  temperament : "Evil"
});

george.save(function(err, cat){
  if(err){
    console.log("Something went wrong")
  }
  else{
    console.log("We just saved cat to the database")
    console.log(cat);
  }
});
*/
//Or use

Cat.create({
  name : "Snow bell",
  age : 15,
  temperament : "Bland"
}, function(err, cat){
  if(err)
    console.log(err);
  else
    console.log(cat);
})

//Retrieve all the cats from the database
//Use find method on cat model
Cat.find({}, function(err, cats){
  if(err){
    console("Oh No! Error!");
    console.log(err);
  }
  else{
    console.log("All the cats ....")
    console.log(cats)
  }
})