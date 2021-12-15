var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var PointSetting = require("../models/PointSetting");
var PointLog = require("../models/PointLog");
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
const { post } = require("request");
var serverKey = "AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU";
var fcm = new FCM(serverKey);

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

router.get('/', function (req, res) {
  async.waterfall([
  function (callback) {
    PointSetting.find()
    .sort({ "pointAt": -1 })
    .exec(function (err, pointSetting) {
      if (err) callback(err);
      callback(null, pointSetting);
    });
  }], function (err, pointSetting) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/PointSetting-Mgt/index", {
      pointSetting: pointSetting,
      urlQuery: req._parsedUrl.query,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 포인트 설정 리스트 화면


router.post('/pointSettingUpdate/', isLoggedIn, function (req, res, next) {
      var newPost = req.body.post;
      console.log(req.body.post);
      console.log(req.body.post.point.length);
      newPost.author = req.user._id;
      for(var i = 0; req.body.post.point.length > i; i ++) {
        if(i == 0) { //회원가입
          PointSetting.findOneAndUpdate({
            pointAt : "회원가입"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            if(result1) {
              console.log("성공 ");
              res.status(200).json();
            }
          }
          );
        } else if(i == 1) { //리뷰글 등록시
          PointSetting.findOneAndUpdate({
            pointAt : "리뷰글"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 2) { //게시글 등록시
          PointSetting.findOneAndUpdate({
            pointAt : "게시글"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 3) { //댓글 등록시
          PointSetting.findOneAndUpdate({
            pointAt : "댓글"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 4) { //SNS 공유시
          PointSetting.findOneAndUpdate({
            pointAt : "SNS"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 5) { //피부 케어시
          PointSetting.findOneAndUpdate({
            pointAt : "피부케어"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 6) { //피부 측정시
          PointSetting.findOneAndUpdate({
            pointAt : "피부측정"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            // if(result1) {
            //   console.log("성공 ");
            //   res.status(200).json();
            // }
          }
          );
        }
        else if(i == 7) { //출석 체크시
          PointSetting.findOneAndUpdate({
            pointAt : "출석체크"
          }, {
            usePoint : req.body.post.usePoint[i], // ejs에서 넘어오는 회원가입 사용여부
            point: req.body.post.point[i], //ejs에서 넘어온 회원가입시 포인트 점수 제한
            daylimit: req.body.post.daylimit[i], //ejs 에서 넘어온 1일 최대 적립 회수
          }
          , function (err, result1) {
            if(err){
              console.log("에러 ");
              res.status(400).json();
            }
            if(result1) {
              console.log("성공 ");
              res.status(200).json();
            }
          }
          );
          // return res.redirect('/pointSetting/');
          // res.redirect('/pointSetting/');
        }
      }
      res.redirect('/pointSetting/');
}); 
// update index


router.get('/pointIndex', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 80;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);
  async.waterfall([
    function(callback) {
    if (!search.findUser) return callback(null);
    // PointLog.find(search.findUser, function(err, points) {
    //   if (err) callback(err);
    //   var or = [];
    //   points.forEach(function(point) {
    //     or.push({
    //       mpoint: mongoose.Types.ObjectId(point._id)
    //     });
    //   });
    User_admin.find(search.findUser, function(err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function(user) {
        or.push({
          mpoint: mongoose.Types.ObjectId(user._id)
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
      PointLog.count(search.findPost || testSearch.dayCreated[0].created, function(err, count) {
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
      PointLog.find(testSearch.dayCreated[0])
      // .populate("mpoint")
      .populate("author")
      .sort({createdAt : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, pointlog) {
        if (err) callback(err);
        callback(null, pointlog, maxPage);
      });
    } else {
      PointLog.find(search.findPost)
      // .populate("mpoint")
      .populate("author")
      .sort({createdAt : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, pointlog) {
        if (err) callback(err);
        callback(null, pointlog, maxPage);
      });
    }
  },
  ], 
  function(err, pointlog, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/PointSetting-Mgt/pointIndex", {
      pointlog: pointlog,
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
// 포인트 설정 리스트 화면


router.get("/newShow/:id", function (req, res) {
  PointLog.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });

      res.render("PlinicAdmin/Operation/PointSetting-Mgt/newShow", {
        post: post,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); 
// Show


router.post('/:id/create', function(req, res) {
  
    console.log(req.body);
    var newBody = req.body;

    var pointPreLog = {
      point: newBody.post.point,
      reason: '관리자 지급',
      status: true
    }

    newBody.author = req.user._id;
    PointLog.findOneAndUpdate({
      _id: req.params.id
    }, {
      $push: {
        point: pointPreLog
        // "point" : newBody
      },
      $inc: { "totalPoint": newBody.post.point }
    }, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      // res.redirect('/pointSetting/newShow/' + req.params.id + "?" + req._parsedUrl.query);
      res.redirect('/pointSetting/pointIndex')
    });
  }); 
// 포인트 지급


router.get("/newIndex", function (req, res) {
  return res.render("PlinicAdmin/Operation/PointSetting-Mgt/newIndex", {});
});
// 회원 개별 포인트 지급 화면


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;

function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (
    queries.searchType &&
    queries.searchText &&
    queries.searchText.length >= 2
  ) {
    //검색어 글자수 제한 하는 것
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
    if (postQueries.length > 0)
      findPost = {
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

function createSearchTest(querie) {
  findUser = null
  if (!isEmpty2(querie.termCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(querie.termCheck)) {
      var createdAt = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = createdAt.setMonth(createdAt.getMonth()-12);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = createdAt.setDate(createdAt.getDate()-7);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = createdAt.setMonth(createdAt.getMonth()-1);

        dayCreated.push({
          createdAt: {
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
      var createdAt = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = createdAt.setMonth(createdAt.getMonth()-12);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = createdAt.setDate(createdAt.getDate()-7);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = createdAt.setMonth(createdAt.getMonth()-1);

        dayCreated.push({
          createdAt: {
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

function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}
