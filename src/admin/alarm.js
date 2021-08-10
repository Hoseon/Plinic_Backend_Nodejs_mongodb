var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Alarm = require("../models/Qna");
var CommuBeautyCounter = require("../models/CommuBeautyCounter");
var CommuBeauty = require("../models/CommuBeauty");
// var QnaCounter = require("../models/QnaCounter");
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

router.get("/", function (req, res) {

  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10;
  var search = createSearch(req.query);
  async.waterfall(
    [
      function(callback) {
        CommuBeautyCounter.findOne(
          {
            name: "postMgt"
          },
          function(err, counter) {
            if (err) callback(err);
            vistorCounter = counter;
            callback(null);
          }
        );
      },
      function(callback) {
        if (!search.findUser) return callback(null);
        User_admin.find(search.findUser, function(err, users) {
          if (err) callback(err);
          var or = [];
          users.forEach(function(user) {
            or.push({
              author: mongoose.Types.ObjectId(user._id)
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
      },
      function(callback) {
        if (search.findUser && !search.findPost.$or)
          return callback(null, null, 0);
        CommuBeauty.count(search.findPost, function(err, count) {
          if (err) callback(err);
          skip = (page - 1) * limit;
          maxPage = Math.ceil(count / limit);
          callback(null, skip, maxPage);
        });
      },
      function(skip, maxPage, callback) {
        if (search.findUser && !search.findPost.$or)
          return callback(null, [], 0);
        CommuBeauty.find(search.findPost)
          .sort({ createdAt: -1 })
          .populate("author")
          .sort({ seq: 1, updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(function(err, commuBeauty) {
            if (err) callback(err);
            callback(null, commuBeauty, maxPage);
          });
      }
    ],
    function(err, commuBeauty, maxPage) {
      if (err)
        return res.json({
          success: false,
          message: err
        });
      return res.render("PlinicAdmin/Contents/BeautyTip/PostMgt/index", {
        commuBeauty: commuBeauty,
        user: req.user,
        page: page,
        maxPage: maxPage,
        urlQuery: req._parsedUrl.query,
        search: search,
        counter: vistorCounter,
        postsMessage: req.flash("postsMessage")[0]
      });
    }
  );
});
//기본 알림 화면

router.get("/:id", function (req, res) {
  return res.render("PlinicAdmin/Operation/Alarm/index", {});
});
//기본 알림 화면 2021-04-12 기본알림 상세 화면

router.post("/BeautyTip/PostMgt", isLoggedIn, function(req, res, next) {

  // req.body.alertType = "challDelivery";
  req.body.alertType = "challAlarm"
  req.body.alarmName = "챌린지 배송 안내";
  req.body.alarmCondition = "챌린지 배송 안내";
  req.body.alarmDesc = "챌린지 배송 안내";
  req.body.mange = true;
  async.waterfall(
    [
      function(callback) {
        CommuBeautyCounter.findOne(
          {
            name: "postMgt"
          },
          function(err, counter) {
            if (err) callback(err);
            if (counter) {
              callback(null, counter);
            } else {
              CommuBeautyCounter.create(
                {
                  name: "postMgt",
                  totalCount: 0
                },
                function(err, counter) {
                  if (err)
                    return res.json({
                      success: false,
                      message: err
                    });
                  callback(null, counter);
                }
              );
            }
          }
        );
      }
    ],
    function(callback, counter) {
      var newPost = req.body.post;
      newPost.author = req.user._id;
      newPost.numId = counter.totalCount + 1;
      req.body.post.filename = req.file.key;
      req.body.post.originalName = req.file.originalname;
      req.body.post.showLocation = req.body.showLocation;
      req.body.post.tabLocation = req.body.tabLocation;
      CommuBeauty.create(req.body.post, function(err, post) {
        if (err) {
          console.log("포스트 관리 등록 에러");
          console.log(err);
          return res.json({
            success: false,
            message: err
          });
        }
        counter.totalCount++;
        counter.save();
        res.redirect("/beautyTip/PostMgt/index");
      });
    }
  );
}
); // create

// router.get("/getUserAlarms", function(req, res, next) {
//   async.waterfall([
//     () => {
//       Alarm.find(
//         {
//           mange:true
//         },
//         (err, docs) => {
//           if (err) res.sendStatus(400);

//           if (docs) res.status(201).json(docs);
//         }
//       );
//     }
//   ]);
// });

// router.get('/getUserAlarms/:id', function(req, res) {
//   async.waterfall([function(callback) {
//     Alarm.findOne({
//       _id: req.params.id
//     }, function(err, docs) {
//       res.json(docs);
//     })
//   }]);
// });

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
