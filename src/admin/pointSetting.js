var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var PointSetting = require("../models/PointSetting");
var QnaCounter = require("../models/QnaCounter");
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
}); // 포인트 설정 리스트 화면

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
  }); // update

router.get("/new", function (req, res) {
  return res.render("PlinicAdmin/Operation/PointSetting-Mgt/new", {});
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
    if (searchTypes.indexOf("title") >= 0) {
      postQueries.push({
        title: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.title = queries.searchText;
    }
    if (searchTypes.indexOf("body") >= 0) {
      postQueries.push({
        body: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.body = queries.searchText;
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
