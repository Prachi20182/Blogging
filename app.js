require("dotenv").config()
const express =  require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blogging",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/blogging", 
  passport.authenticate("google", { failureRedirect: "/signin" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});

app.get("/aboutus", function(req, res){
    res.render("aboutus");
});

app.get("/read", function(req, res){
    res.render("read");
});

app.get("/signup", function(req, res){
    res.render("signup");
})

app.get("/signin", function(req, res){
   res.render("signin");
});

app.post("/signup", function(req, res){
    User.register({username: req.body.email}, req.body.pass, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
     });
});

app.post("/signin", function(req, res){
    const user = new User({
        username: req.body.your_email,
        password: req.body.your_pass
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});





app.listen(3000, function(){
    console.log("Server started successfully on port 3000!");
})