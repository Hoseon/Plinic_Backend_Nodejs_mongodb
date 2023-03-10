var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User          = require('../models/User_admin');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('local-login',
  new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, email, password, done) {
      User.findOne({ 'email' :  email }, function(err, user) {
        if (err) return done(err);
        if (!user){
            req.flash("email", req.body.email);
            return done(null, false, req.flash('loginError', '사용자를 찾을 수 없습니다.'));
        }
        if (!user.authenticate(password)){
            req.flash("email", req.body.email);
            return done(null, false, req.flash('loginError', '패스워드가 일치하지 않습니다.'));
        }
        req.flash('postsMessage', 'Welcome '+user.nickname+'!');
        return done(null, user);
      });
    }
  )
);

module.exports = passport;
