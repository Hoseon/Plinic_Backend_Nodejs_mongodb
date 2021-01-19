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
  return res.render("PlinicAdmin/Product/Main/index", {});
});
//상품관리 메인 화면

////////////////////////////////////// 상품 데이터
router.get("/ProductData/ProductList", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductList/index", {});
});
//상품데이터 상품관리 리스트 화면

router.get("/ProductData/ProductRegister", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRegister/index", {});
});
//상품데이터 상품관리 생성 화면

router.get("/ProductData/ProductCategory", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index", {});
});
//상품데이터 카테고리 화면

router.get("/ProductData/ProductTabShow", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductTabShow/index", {});
});
//상품데이터 탭 진열 관리 화면

router.get("/ProductData/ProductRecomShow", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRecomShow/index", {});
});
//상품데이터 상품 추천 노출위치 관리 화면

router.get("/ProductData/ProductTransCost", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductTransCost/index", {});
});
//상품데이터 배송비 설정 화면

router.get("/ProductData/ProductQnA", function (req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductQnA/index", {});
});
//상품데이터 문의관리 화면

//////////////////////////////////// 상품데이터 종료


router.get("/", function (req, res) {
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
