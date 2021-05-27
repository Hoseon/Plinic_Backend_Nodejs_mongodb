var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var ADBanner = require("../models/ADBanner");
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

router.get('/', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
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
    if (search.findUser && !search.findPost.$or) 
    return callback(null, null, 0);
    ADBanner.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) 
    return callback(null, [], 0);
    ADBanner.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "seq": 1, "updatedAt": -1 })
    .skip(skip)
    .limit(limit)
    .exec(function (err, adbanner) {
      if (err) callback(err);
      callback(null, adbanner, maxPage);
    });
  }], function (err, adbanner, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/ADBanner/index", {
      adbanner: adbanner,
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

router.get('/getadbanners/', function (req, res) {
  ADBanner.findOne({}, function(error, data){
    if(error) {
      return res.status(400).json(err);
    }
    if(data) {
      res.status(201).json(data);
    }
  })
});

router.delete('/rowdel/:id', isLoggedIn, function(req, res, next) {
  ADBanner.findOneAndRemove({
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
    res.redirect('/adBanners/');
  });
}); //row 삭제

router.get("/:id", function (req, res) {
  ADBanner.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });

      // console.log(post);

      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;

      var twourl = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.twoFileName;

      var threeurl = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.threeFileName;

      res.render("PlinicAdmin/Contents/ADBanner/show", {
        post: post,
        url: url,
        twourl: twourl,
        threeurl: threeurl,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); //광고배너 Show

router.get('/:id/edit', isLoggedIn, function (req, res) {
  ADBanner.findById(req.params.id, function (err, post) {
    var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;

    var twourl = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.twoFileName;

    var threeurl = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.threeFileName;

    //보여주기 및 삭제
    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginaFileName = post.originalName; //이전 파일들은 삭제

    var pretwoFileName = post.twoFileName;
    var pretwoOriginalName = post.twoOriginalName;

    var prethreeFileName = post.threeFileName;
    var prethreeOriginalName = post.threeOriginalName;



    if (err) return res.json({
      success: false,
      message: err
    });
    res.render("PlinicAdmin/Contents/ADBanner/edit", {
      post: post,
      prefilename: prefilename,
      preoriginaFileName : preoriginaFileName,
      pretwoFileName: pretwoFileName,
      pretwoOriginalName: pretwoOriginalName,
      prethreeFileName: prethreeFileName,
      prethreeOriginalName: prethreeOriginalName,
      url: url,
      twourl: twourl,
      threeurl: threeurl,
      user: req.user
    });
  });
}); // 상품 edit 페이지


router.put('/Adbanneredit/:id', s3upload.fields([{
    name: 'image'
  }, {
    name: 'twoimage'
  }, {
    name: 'threeimage'
  }
]), isLoggedIn, function (req, res, next) {
    req.body.post.updatedAt = Date.now();
    req.body.post.filename = req.files['image'][0].key;
    req.body.post.originalName = req.files['image'][0].originalname;

    req.body.post.twoFileName = req.files['twoimage'][0].key;
    req.body.post.twoOriginalName = req.files['twoimage'][0].originalname;

    req.body.post.threeFileName = req.files['threeimage'][0].key;
    req.body.post.threeOriginalName = req.files['threeimage'][0].originalname;
  
    var params = {
      Bucket: 'plinic',
      Delete: { // required
        Objects: [ // required
          {
            Key: req.body.prefilename // required
          },
          {
            Key: req.body.pretwoFileName // required
          },
          {
            Key: req.body.prethreeFileName // required
          },
        ]
      }
    };
    s3.deleteObjects(params, function (err, data) {
      if (err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + req.body.prefilename + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
      ADBanner.findOneAndUpdate({
        _id: req.params.id,
        // author: req.user._id
      }, req.body.post, function (err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        if (!post) return res.json({
          success: false,
          message: "No data found to update"
        });
        res.redirect('/adBanners/');
      });
    });
  }); // 광고 배너 update

router.get("/ADBanner/new", function (req, res) {
  return res.render("PlinicAdmin/Contents/ADBanner/new", {});
});
//광고배너 신규 등록 화면

router.post('/create', s3upload.fields([
  { name: 'image' }, { name: 'twoimage' }, { name: 'threeimage' }]), isLoggedIn, function (req, res, next) {
      var newPost = req.body.post;
      newPost.author = req.user._id;
      req.body.post.filename = req.files['image'][0].key;
      req.body.post.originalName = req.files['image'][0].originalname;

      req.body.post.twoFileName = req.files['twoimage'][0].key;
      req.body.post.twoOriginalName = req.files['twoimage'][0].originalname;

      req.body.post.threeFileName = req.files['threeimage'][0].key;
      req.body.post.threeOriginalName = req.files['threeimage'][0].originalname;

      ADBanner.create(req.body.post, function (err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        res.redirect('/adBanners/');
      });
    // });
  }); // create



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
