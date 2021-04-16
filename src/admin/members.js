var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var User = require("../models/user");
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

// router.get('/', function(req, res) {
//   var vistorCounter = null;
//   var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
//   var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
//   var search = createSearch(req.query);
//   var testSearch = createSearchTest(req.query);

//   async.waterfall([function(callback) {
//     if (!search.findUser) return callback(null);
//     User.find(search.findUser, function(err, users) {
//       if (err) callback(err);
//       var or = [];
//       users.forEach(function(users) {
//         or.push({
//           author: mongoose.Types.ObjectId(users._id)
//         });
//       });
//       if (search.findPost.$or) {
//         search.findPost.$or = search.findPost.$or.concat(or);
//       } else if (or.length > 0) {
//         search.findPost = {
//           $or: or
//         };
//       }
//       callback(null);
//     });
//   }, function(callback) {
//     if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
//     User.count(search.findPost, function(err, count) {
//       if (err) callback(err);
//       skip = (page - 1) * limit;
//       maxPage = Math.ceil(count / limit);
//       callback(null, skip, maxPage);
//     });
//   }, function(skip, maxPage, callback) {
//     if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
//     User.find(search.findPost).populate("author").sort('-created').skip(skip).limit(limit).exec(function(err, user) {
//       if (err) callback(err);
//       callback(null, user, maxPage);
//     });
//   },
//   function(skip, maxPage, callback) {
//     if (testSearch.findUser && !testSearch.findPost.$or)
//       return callback(null, [], 0);

//     if(testSearch.sortViews[0]) {
//       User.find(testSearch.findPost)
//       .sort({"seq": 1})
//       .sort({ "created": 1 })
//       .sort(testSearch.sortViews[0])
//       .populate("author")
//       .sort(testSearch.sortViews[0])
//       .skip(skip)
//       .limit(limit)
//       .exec(function(err, user) {
//         if (err) callback(err);
//         callback(null, user, maxPage);
//       });
//     } else {
//       User.find(testSearch.findPost)
//       .sort({"seq": 1})
//       .sort({ "created": 1})
//       .populate("author")
//       .sort({ seq: 1, created: -1 })
//       .skip(skip)
//       .limit(limit)
//       .exec(function(err, user) {
//         if (err) callback(err);
//         callback(null, user, maxPage);
//       });
//     }
//   }
//   ], 
//   function(err, user, maxPage) {
//     if (err) return res.json({
//       success: false,
//       message: err
//     });
//     return res.render("PlinicAdmin/Operation/MemberMgt/index", {
//       users: user,
//       user: req.user,
//       page: page,
//       maxPage: maxPage,
//       urlQuery: req._parsedUrl.query,
//       search: search,
//       counter: vistorCounter,
//       postsMessage: req.flash("postsMessage")[0]
//     });
//   });
// });




router.get('/', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);

  async.waterfall([
    function(callback) {
      // var created = new Date();
      // created.setDate(created.getDate()-7);
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
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    User.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, 
  function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    User.find(search.findPost).populate("author").sort('-created').skip(skip).limit(limit).exec(function(err, user) {
      if (err) callback(err);
      callback(null, user, maxPage);
    });
  },
  // function(callback) {
  //   if (testSearch.findUser && !testSearch.findPost.$or)
  //     return callback(null, null, 0);
  //   User.count(testSearch.findPost, function(err, count) {
  //     if (err) callback(err);
  //     skip = (page - 1) * limit;
  //     maxPage = Math.ceil(count / limit);
  //     callback(null, skip, maxPage);
  //   });
  // },
  // function(skip, maxPage, callback) {
  //   if (testSearch.findUser && !testSearch.findPost.$or)
  //     return callback(null, [], 0);

  //   if(testSearch.termViews[0]) {
  //     User.find(testSearch.findPost)
  //     .sort({"seq": 1})
  //     .sort({ "created": 1 })
  //     .sort(testSearch.termViews[0])
  //     .populate("author")
  //     .sort(testSearch.termViews[0])
  //     .sort(testSearch.termViews[0])
  //     .skip(skip)
  //     .limit(limit)
  //     .exec(function(err, user) {
  //       if (err) callback(err);
  //       callback(null, user, maxPage);
  //     });
  //   } else {
  //     User.find(testSearch.findPost)
  //     .sort({"seq": 1})
  //     .sort({ "created": 1})
  //     .populate("author")
  //     .sort({ seq: 1, created: -1 })
  //     .skip(skip)
  //     .limit(limit)
  //     .exec(function(err, user) {
  //       if (err) callback(err);
  //       callback(null, user, maxPage);
  //     });
  //   }
  // },
  ], 
  async.waterfall([
    
    function(callback) {
      if (testSearch.findUser && !testSearch.findPost.$or)
        return callback(null, null, 0);
      User.count(testSearch.findPost, function(err, count) {
        if (err) callback(err);
        skip = (page - 1) * limit;
        maxPage = Math.ceil(count / limit);
        callback(null, skip, maxPage);
      });
    },
    function(skip, maxPage, callback) {
      if (testSearch.findUser && !testSearch.findPost.$or)
        return callback(null, [], 0);

      if(testSearch.termViews[0]) {
        User.find(testSearch.findPost)
        .sort({"seq": 1})
        // .sort({ "created": 1 })
        .sort(testSearch.termViews[0])
        .populate("author")
        .sort(testSearch.termViews[0])
        .sort(testSearch.termViews[0])
        .skip(skip)
        .limit(limit)
        .exec(function(err, user) {
          if (err) callback(err);
          callback(null, user, maxPage);
        });
      } else {
        User.find(testSearch.findPost)
        .sort({"seq": 1})
        // .sort({ "created": 1})
        .populate("author")
        // .sort({ seq: 1, created: -1 })
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
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      testSearch : testSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  }));
});


router.get("/show", function (req, res) {
  return res.render("PlinicAdmin/Operation/MemberMgt/show", {});
});
//고객 관리 show 화면

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;

function createSearchTest(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (!isEmpty2(queries.searchCheck)) {
    var postQueries = [];
    var termViews = []; //기간별 조희
    // var created = new Date();
    var findAfter = {
      // home : false,
      // poreSize : false,
      // poreCount : false,
      // skinTone : false,
      // clean : false,
      // munjin : false,
      // editor : false,
      // tip: false,
      // hit: false,
      // new: false
    };

    findPost = {
      $or: postQueries
    };

    if (!isEmpty2(queries.termCheck)) {
      
      if(isEmpty2(!queries.termCheck.all)) {
        var created = new Date();
        termViews.push({
          created : created.setMonth(created.getMonth()-12)
          // created: created
        });
        postQueries.push();
      } else {
        termViews.push();
        postQueries.push();
      }
  
      if(isEmpty2(!queries.termCheck.weeklyy)) {
        var created = new Date();
        termViews.push({
          created : created.setDate(created.getDate()-7)
          // created: created
        });
        postQueries.push();
      } else {
        termViews.push();
        postQueries.push();
      }

      if(isEmpty2(!queries.termCheck.monthy)) {
        var created = new Date();
        termViews.push({
          created : created.setMonth(created.getMonth()-1)
          // created: created
        });
        postQueries.push();
      } else {
        termViews.push();
        postQueries.push();
      }

      isEmpty2(!queries.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!queries.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!queries.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }

    return {
      searchText: queries.searchCheck,
      findPost: findPost,
      findUser: findUser,
      highlight: highlight,
      findAfter: findAfter,
      termViews : termViews
    };

  } else {
    var searchCheck = {
      // home : false,
      // poreSize : false,
      // poreCount : false,
      // skinTone : false,
      // clean : false,
      // munjin : false,
      // home : false,
    }

    var postQueries = [];
    var termViews = [];
    var findAfter = {
      // home : false,
      // poreSize : false,
      // poreCount : false,
      // skinTone : false,
      // clean : false,
      // munjin : false,
      // editor : false,
    };

    if (!isEmpty2(queries.termCheck)) {

      if(isEmpty2(!queries.termCheck.all)) {
        var created = new Date();
        termViews.push({
          created : created.setMonth(created.getMonth()-12)
          // created : created
        });
      } else {
      }
  
      if(isEmpty2(!queries.termCheck.weeklyy)) {
        var created = new Date();
        termViews.push({
          created : created.setDate(created.getDate()-7)
          // created : created
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.monthy)) {
        var created = new Date();
        termViews.push({
          created : created.setMonth(created.getMonth()-1)
          // created : created
        });
      } else {
      }

      isEmpty2(!queries.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!queries.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!queries.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }


    return {
      searchType: queries.searchType,
      searchText: queries.searchText,
      findPost: findPost,
      findUser: findUser,
      findAfter: findAfter,
      highlight: highlight,
      termViews: termViews
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
