var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Qna = require("../models/Qna");
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
var serverKey = "AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU";
var fcm = new FCM(serverKey);

//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
    //cb(null, UPLOAD_PATH)
  },
  filename: function(req, file, cb) {
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
    destination: function(req, file, cb) {
      cb(null, "/www/plinic");
    },
    filename: function(req, file, cb) {
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

router.get("/Main", function(req, res) {
  return res.render("PlinicAdmin/Contents/Main/index", {});
});
//콘텐츠관리 메인 화면

router.get("/Challenge", function(req, res) {
  return res.render("PlinicAdmin/Contents/ChallengeMgt/index", {});
});
//콘텐츠관리 챌린지 화면

router.get("/Challenge/new", function(req, res) {
  return res.render("PlinicAdmin/Contents/ChallengeMgt/new", {});
});
//콘텐츠관리 챌린지 신규 등록 화면

router.get("/BeautyTip/PostMgt", function(req, res) {
  return res.render("PlinicAdmin/Contents/BeautyTip/PostMgt/index", {});
});
//포스트 관리 리스트 화면

router.get("/BeautyTip/PostMgt/new", function(req, res) {
  return res.render("PlinicAdmin/Contents/BeautyTip/PostMgt/new", {});
});
//포스트 관리 리스트 화면

router.get("/BeautyTip/PostDisplay", function(req, res) {
  return res.render("PlinicAdmin/Contents/BeautyTip/PostDisplay/index", {});
});
//포스트 진열관리 리스트 화면

router.get("/BeautyTip/MovieMgt", function(req, res) {
  return res.render("PlinicAdmin/Contents/BeautyTip/MovieMgt/index", {});
});
//포스트 영상 관리 리스트 화면

router.get("/BeautyTip/MovieDisplay", function(req, res) {
  return res.render("PlinicAdmin/Contents/BeautyTip/MovieDisplay/index", {});
});
//포스트 영상 진열 관리 리스트 화면

////////////////////////////////////// 게시판 댓글
router.get("/Comments/ChallengeComment", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/ChallengeComment/index", {});
});
//챌린지 댓글 리스트 화면

router.get("/Comments/MovieComment", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/MovieComment/index", {});
});
//영상 댓글 리스트 화면

router.get("/Comments/SkinQna", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/SkinQna/index", {});
});
//피부고민 게시판 리스트 화면

router.get("/Comments/Notice", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/Notice/index", {});
});
//공지사항 게시판 리스트 화면

router.get("/Comments/Faq", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/Faq/index", {});
});
//FAQ 게시판 리스트 화면

router.get("/Comments/Answer", function(req, res) {
  return res.render("PlinicAdmin/Contents/Comments/Answer/index", {});
});
//문의하기 게시판 리스트 화면

//////////////////////////////////// 게시판 댓글 종료

router.get("/HomePopup", function(req, res) {
  return res.render("PlinicAdmin/Contents/HomePopup/index", {});
});
//홈 팝업 리스트 화면

router.get("/ADBanner", function(req, res) {
  return res.render("PlinicAdmin/Contents/ADBanner/index", {});
});
//광고배너 리스트 화면


router.get("/", function(req, res) {
  return res.render("PlinicAdmin/bootstraptest/index", {});
});
// index

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
