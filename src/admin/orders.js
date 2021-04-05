var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var async = require("async");
var User_admin = require("../models/User_admin");
var Orders = require("../models/Orders");
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
var OrdersCounter = require("../models/OrdersCounter");

var multerS3 = require('multer-s3');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();
let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'plinic',
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + '-' + Date.now()
      });
    },
    key: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    },
    acl: 'public-read'
  })
});

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
  return res.render("PlinicAdmin/Orders/Main/index", {});
});
//주문 관리 메인 화면

// router.get("/OrderMgt", function (req, res) {
//   return res.render("PlinicAdmin/Orders/OrderMgt/index", {});
// });
//주문 관리 리스트 화면

router.get('/', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    // function (callback) {
    // OrdersCounter.findOne({
    //   name: "carezone"
    // }, function (err, counter) {
    //   if (err) callback(err);
    //   vistorCounter = counter;
    //   callback(null);
    // });
    // },
    function (callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function (err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function (user) {
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
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Orders.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Orders.find(search.findPost).sort({ "seq": 1 }).populate("author").sort({ "seq": 1, "updatedAt": -1 }).skip(skip).limit(limit).exec(function (err, orders) {
      if (err) callback(err);
      callback(null, orders, maxPage);
    });
  }], function (err, orders, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Orders/OrderMgt/index", {
      orders: orders,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // new index


router.post('/statusUpdate/:id', function(req, res) {
  // console.log(req.body);
  var newstatus = req.body;
  Orders.findOneAndUpdate({
    _id: req.params.id,
  }, 
  req.body.post,
  {
    $push: {
      body: newstatus
    }
  }, 
  function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    res.redirect("/orders/");
  });
}); // 주문 상태 업데이트



router.post('/:id/deliverNoUpdate', function(req, res) {
    // console.log(req.body);
    var newdeliverNo = req.body;
    Orders.findOneAndUpdate({
      _id: req.params.id
    }, 
    req.body.post,
    {
      $push: {
        body: newdeliverNo
      }
    }, 
    function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      res.redirect("/orders/");
    });
  }); // 운송장 번호 Update


  router.delete('/del/:id', isLoggedIn, function(req, res, next) {
    Orders.findOneAndRemove({
      _id: req.params.id,
      // author: req.user._id
    }, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      if (!post) return res.json({
        success: false,
        message: "No data found to delete"
      });
      var params = {
        Bucket: 'plinic',
        Delete: { // required
          Objects: [ // required
            { Key: post.filename },
          ]
        }
      };
      s3.deleteObjects(params, function(err, data){
        if(err) {
          console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
          res.status(500);
        }
        else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
      });
      res.redirect('/orders/');
    });
  }); // row 데이터 삭제


  router.post('/', isLoggedIn, function(req, res, next){

    async.waterfall([function(callback){
      OrdersCounter.findOne({name:"orders"}, function (err,counter) {
        if(err) callback(err);
        if(counter){
           callback(null, counter);
        } else {
          
        }
      });
    }],function(callback, counter){
      var newPost = req.body.post;
      newPost.author = req.user._id;
      Orders.create(req.body.post,function (err,post) {
        if(err) return res.json({success:false, message:err});
        res.redirect('/orders');
      });
    });
  });


router.get("/:id", function (req, res) {
  Orders.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });

      // console.log(post);

      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      res.render("PlinicAdmin/Orders/OrderMgt/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 제품 상세페이지 show




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
