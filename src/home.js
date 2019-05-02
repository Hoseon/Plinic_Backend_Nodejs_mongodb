var express  = require('express');
var router   = express.Router();
var mongoose = require('mongoose');
var passport = require('./config/passport.js');

router.get('/', function (req,res) {
  //res.redirect('/posts');
  res.render('login/login',{email:req.flash("email")[0], loginError:req.flash('loginError'), loginMessage:req.flash('loginMessage')});
});

router.get('/menus', function (req,res) {
  //res.redirect('/posts');
  res.render('menus/menus', {postsMessage:req.flash("postsMessage")[0]});
});

router.get('/login', function (req,res) {
  res.render('login/login',{email:req.flash("email")[0], loginError:req.flash('loginError'), loginMessage:req.flash('loginMessage')});
});
router.post('/login', passport.authenticate('local-login', {
    successRedirect : '/menus',
    failureRedirect : '/home/login',
    failureFlash : true
  })
);
router.get('/logout', function(req, res) {
    req.logout();
    req.flash("postsMessage", "Good-bye, have a nice day!");
    res.redirect('/home/login');
});

module.exports = router;
