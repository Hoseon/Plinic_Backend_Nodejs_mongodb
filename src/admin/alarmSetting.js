var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var User = require("../models/user");
var Alarm = require("../models/Qna");
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

router.get("/", function (req, res) {
  return res.render("PlinicAdmin/Operation/AlarmSetting-Mgt/index", {});
});
// 그룹/개별 알림 관리 리스트 화면


// router.get("/marketing", function(req, res) {
//   return res.render("PlinicAdmin/Operation/AlarmSetting-Mgt/newIndex", {});
// });
//여기에 광고(마케팅 알림) 페이지 새로 신설

router.get('/marketing', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 80;
  var search = createSearch(req.query);
  // var testSearch = createSearchTest(req.query);
  async.waterfall([
    function(callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function(err, users) {
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
      if (search.findUser && !search.findPost.$or) 
      return callback(null, null, 0);
      User.count(search.findPost, function(err, count) {
        if (err) callback(err);
        skip = (page - 1) * limit;
        maxPage = Math.ceil(count / limit);
        callback(null, skip, maxPage);
      });

  }, 
  function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) 
    return callback(null, [], 0);

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
  ], 
  function(err, user, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/AlarmSetting-Mgt/newIndex", {
      users: user,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
});
// 광고(마케팅 알림) 페이지 새로 신설


//여기 알림 보내기 들어오면 필요한 input post 넣어서 써보기//
router.post('/:id/fcm', function(req, res) {

  Alarm.findOneAndUpdate({
    email: req.body.user.email
  }, {
    $set: {
      alarmCondition: false,
      mange: false,
      writerEmail: req.body.user.email, //받는 사람 이메일
      // email: 보내는 사람은 파이어베이스를 통하기 때문에 이메일이 없음
      // skinId: 열어야할 페이지의 id가 없음
      alertType: "마케팅알림",
      // alermName: req.notification.title, x
      // alermName: notification.title, x
      // alermName: data.title, x
      
      // alermName: message.notification.title, // ?
      // alermName: message.title, ?
      alarmDesc: notification.body,
    }
  },
  function(err, post2) {
    // 에러냐
    if (err) {
      console.log("error : " + err);
      return res.status(400).json({
        'msg': '알림 FCM이 저장 되지 않았습니다. <br /> Error : ' + err
      });
    // 성공이냐
    } if(!err) {
      // return res.status(201).json(post2);
      //사용자의 Email을 User Collection에서 찾아서 PushToken키를 가져온다.
      var pushtoken = '';
      if(req.body.email !== '') {
        User.findOne({
          email : req.body.email
        },function(err, User) {
          if(User) {
            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
              to: User.pushtoken,

              notification: {
                // title: '플리닉 보상 알림',
                title: req.body.user.alertType, //newIndex에서 가져오는지
                // body: "마케팅 광고입니다.",
                body: req.body.user.alarmDesc, //newIndex에서 가져오는지
                sound: "default",
                click_action: "FCM_PLUGIN_ACTIVITY",
              },

              data: { //you can send only notification or only data(or include both)
                mode: "marketing",
                // id: req.body.id
                id: req.params.id
              }
            };

            fcm.send(message, function(err, response) {
              if (err) {
                console.log("챌린지 보상 푸시 전송 실패 " + req.body.user.email);
              } else {
                console.log("Successfully sent with response: ", response);
              }
            });
          }
        });
      }
    }
  })
});
// 마케팅 mode 보내기 FCM

router.get("/new", function (req, res) {
  return res.render("PlinicAdmin/Operation/AlarmSetting-Mgt/new", {});
});
// 알림 보내기 화면

router.get("/show", function (req, res) {
  return res.render("PlinicAdmin/Operation/AlarmSetting-Mgt/show", {});
});
// 알람 보내기 show 화면

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
