var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var User = require("../models/user");
var Orders = require("../models/Orders");
var UserCounter = require("../models/UserCounter");
var async = require("async");
var User_admin = require("../models/User_admin");
var multer = require("multer");
// var FTPStorage = require('multer-ftp');
var sftpStorage = require("multer-sftp");
let Client = require("ssh2-sftp-client");
var path = require("path");
var fs = require("fs");
var del = require("del");
var http = require("http");
var FCM = require("fcm-node");
var serverKey = "AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU";
var fcm = new FCM(serverKey);
var multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { search } = require("./product");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();

//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
    //cb(null, UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  }
});

let upload = multer({
  storage: storage
});

var sftpUpload = multer({
  storage: new sftpStorage({
    sftp: {
      host: "g1partners1.cafe24.com",
      // secure: true, // enables FTPS/FTP with TLS
      port: 3822,
      user: "g1partners1",
      password: "g100210!!"
    },
    // basepath: '/www/plinic',
    destination: function (req, file, cb) {
      cb(null, "/www/plinic");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now());
    }
  })
});

const sftpconfig = {
  host: "g1partners1.cafe24.com",
  port: 3822,
  user: "g1partners1",
  password: "g100210!!"
};

router.get("/Main", function (req, res) {
  return res.render("PlinicAdmin/Operation/Main/index", {});
});
//고객 관리 메인 화면

router.get('/', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 80;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);
  // var dateSearch = createSearchTests(req.query);
  async.waterfall([
    function(callback) {
    if (!search.findUser) return callback(null);
    User.find(search.findUser, function(err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function(users) {
        or.push({
          author: mongoose.Types.ObjectId(users._id)
        });
      });
      if (search.findPost.$or) {
        search.findPost.$or = search.findPost.$or.concat(or);
      } else if (or.length > 0) {
        search.findPost = {
          $or: or
        };
      }
      callback(null);
    });
  }, function(callback) {
      if (search.findUser && !search.findPost.$or 
        || testSearch.findUser && testSearch.dayCreated[0].created) 
      return callback(null, null, 0);
      User.count(search.findPost || testSearch.dayCreated[0].created, function(err, count) {
        if (err) callback(err);
        skip = (page - 1) * limit;
        maxPage = Math.ceil(count / limit);
        callback(null, skip, maxPage);
      });

  }, 
  function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or 
      || testSearch.findUser && testSearch.dayCreated[0].created) 
    return callback(null, [], 0);

    if(testSearch.dayCreated[0]) {
      User.find(testSearch.dayCreated[0])
      .populate("author")
      .sort({created : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user, maxPage);
      });
    } else {
      User.find(search.findPost)
      .populate("author")
      .sort({created : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user, maxPage);
      });
    }
  },
  ], 
  function(err, user, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/MemberMgt/index", {
      users: user,
      // orders: orders,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      testSearch : testSearch,
      // dateSearch: dateSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
});


router.get("/:id", function (req, res) {
  
  // if(User.findById(req.params.id) && Orders.findById(req.params.id)) {
    User.findById(req.params.id)
    .populate(['author', 'orders'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      res.render("PlinicAdmin/Operation/MemberMgt/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 회원 정보 show


// router.get("/orders/:id", function (req, res) {
//   Orders.findById(req.params.id)
//     .populate(['author', 'orders'])
//     .exec(function (err, post) {
//       if (err) return res.json({
//         success: false,
//         message: err
//       });
//       console.log(post);
//       res.render("PlinicAdmin/Operation/MemberMgt/oshow", {
//         post: post,
//         urlQuery: req._parsedUrl.query,
//         user: req.user,
//         search: createSearch(req.query)
//       });
//     });
// }); // 회원 정보 show

// router.get('/orders/:id', (req, res, next) => {
//   Orders.findAll({    
//     where: {user: req.user}, //조건
//     include: [{ //포험
//       model: User, //어느 부분인지
//       attributes : ['id', 'nick'] //속성
//       }],
//     })
//       .then((Post) => {
//         res.render('mypage', {
//           Post: req.food,
//           twit : Post,
//           user: req.user,
//           loginError: req.flash('loginError'),
//         });
//         console.log(JSON.stringify(Post))
//       })
//       .catch((error) => {
//         console.error(error);
//         next(error);
//       });
//     });


router.delete('/rowdel/:id', isLoggedIn, function(req, res, next) {
  User.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    var params = {
      Bucket: 'plinic',
      Delete: { // required
      }
    };
    s3.deleteObjects(params, function(err, data){
      if(err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/members/');
  });
}); //row 삭제


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;


function createSearchTest(querie) {
  findUser = null
  if (!isEmpty2(querie.termCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated : dayCreated
    };

  } else {

    var dayCreated = [];
    var findAfter = {
      all : false,
      weeklyy: false,
      monthy: false,
    };
    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }


    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated: dayCreated
    };
  }
  
}


function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 2) { //검색어 글자수 제한 하는 것
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("email") >= 0) {
      postQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.email = queries.searchText;
    }
    if (searchTypes.indexOf("name") >= 0) {
      postQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.name = queries.searchText;
    }
    if (searchTypes.indexOf("author!") >= 0) {
      findUser = {
        nickname: queries.searchText
      };
      highlight.author = queries.searchText;
    } else if (searchTypes.indexOf("author") >= 0) {
      findUser = {
        nickname: {
          $regex: new RegExp(queries.searchText, "i")
        }
      };
      highlight.author = queries.searchText;
    }
    if (postQueries.length > 0) findPost = {
      $or: postQueries
    };
  }
  
  return {
    searchType: queries.searchType,
    searchText: queries.searchText,
    findPost: findPost,
    findUser: findUser,
    highlight: highlight
  };
}

function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}