var express  = require('express');
var router   = express.Router();
var mongoose = require('mongoose');
var User     = require('./models/User_admin');
var User2     = require('./models/user');
var async    = require('async');

router.get('/new', function(req,res){
  res.render('users/new', {
                            formData: req.flash('formData')[0],
                            emailError: req.flash('emailError')[0],
                            nicknameError: req.flash('nicknameError')[0],
                            passwordError: req.flash('passwordError')[0]
                          }
  );
}); // new

router.get('/findpassword', function(req,res){
  res.render('users/findPassword');
}); // findPassword


router.get('/snsexists/:email', function(req,res){
  User2.findOne({email : req.params.email}, function (err,user) {
    if(err) return res.json({success:false, message:err});
    if(!user){
      return res.sendStatus(204);
    }
    if(user){
      return res.status(201).json({
        'user': user
      });
    }
  });
}); // SNS사용자 가입 여부 체크



router.post('/', checkUserRegValidation, function(req,res,next){
  User.create(req.body.user, function (err,user) {
    if(err) return res.json({success:false, message:err});
    req.flash("loginMessage","Thank you for registration!");
    res.redirect('/home/login');
  });
}); // create




router.get('/:id', isLoggedIn, function(req,res){
    User.findById(req.params.id, function (err,user) {
      if(err) return res.json({success:false, message:err});
      res.render("users/show", {user: user});
    });
}); // show




router.get('/:id/edit', isLoggedIn, function(req,res){
  if(req.user._id != req.params.id) return res.json({success:false, message:"Unauthrized Attempt"});
  User.findById(req.params.id, function (err,user) {
    if(err) return res.json({success:false, message:err});
    res.render("users/edit", {
                              user: user,
                              formData: req.flash('formData')[0],
                              emailError: req.flash('emailError')[0],
                              nicknameError: req.flash('nicknameError')[0],
                              passwordError: req.flash('passwordError')[0]
                             }
    );
  });
});




// edit
router.put('/:id', isLoggedIn, checkUserRegValidation, function(req,res){
  if(req.user._id != req.params.id) return res.json({success:false, message:"Unauthrized Attempt"});
  User.findById(req.params.id, function (err,user) {
    if(err) return res.json({success:"false", message:err});
    if(user.authenticate(req.body.currentPassword)){
      if(req.body.user.newPassword){
        req.body.user.password = user.hash(req.body.user.newPassword);
      }
      User.findByIdAndUpdate(req.params.id, req.body.user, function (err,user) {
        if(err) return res.json({success:"false", message:err});
        res.redirect('/users/'+req.params.id);
      });
    } else {
      req.flash("formData", req.body.user);
      req.flash("passwordError", "- Invalid password");
      res.redirect('/users/'+req.params.id+"/edit");
    }
  });
});





//update

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}



router.get('/mymainproductlist/:email', function(req,res){
  async.waterfall([function(callback){
    User2.find({
      email : req.params.email
    }, function (err, docs) {
        if (err) {
          console.log("메인 화장품 가져오기 에러 : " + req.param.email);
          res.sendStatus(400);
        }

        if (docs.length > 0) {
          res.json(docs[0].mainproduct);
        } else {
          res.sendStatus(404);
        }
    }).sort({"_id" : -1});
  }])
});

router.get('/mysubproductlist/:email', function(req,res){
  async.waterfall([function(callback){
    User2.find({
      email : req.params.email
    }, function (err, docs) {
        if (err) {
          console.log("서브 화장품 가져오기 에러 : " + req.params.email);
          res.sendStatus(400);
        }

        if (docs.length > 0) {
          res.json(docs[0].subproduct);
        } else {
          res.sendStatus(404);
        }
    }).sort({"_id" : -1});
  }])
});



function checkUserRegValidation(req, res, next) {
  var isValid = true;

  async.waterfall(
    [function(callback) {
      User.findOne({email: req.body.user.email, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
        function(err,user){
          if(user){
            isValid = false;
            req.flash("emailError","- This email is already resistered.");
          }
          callback(null, isValid);
        }
      );
    }, function(isValid, callback) {
      User.findOne({nickname: req.body.user.nickname, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
        function(err,user){
          if(user){
            isValid = false;
            req.flash("nicknameError","- This nickname is already resistered.");
          }
          callback(null, isValid);
        }
      );
    }], function(err, isValid) {
      if(err) return res.json({success:"false", message:err});
      if(isValid){
        return next();
      } else {
        req.flash("formData",req.body.user);
        res.redirect("back");
      }
    }
  );
}

module.exports = router;
