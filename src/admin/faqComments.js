var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Faq = require("../models/Faq");
var FaqCounter = require("../models/FaqCounter");
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
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    .skip(skip)
    .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq, maxPage);
    });
  }], function (err, faq, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/index", {
      faq: faq,
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
// 전체 index


router.get('/accountIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/accountIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 계정 index


router.get('/challengeIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/challengeIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 챌린지 index


router.get('/pointIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/pointIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 포인트 index


router.get('/plinicIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/plinicIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 플리닉 index


router.get('/eventIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/eventIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 이벤트 index


router.get('/productIndex', function (req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
    FaqCounter.findOne({
      name: "faq"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, 
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
    Faq.count(search.findPost, function (err, count) {
      if (err) callback(err);
      // skip = (page - 1) * limit;
      // maxPage = Math.ceil(count / limit);
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Faq.find(search.findPost)
    .sort({ "seq": 1 })
    .populate("author")
    .sort({ "createdAt": -1 })
    // .skip(skip)
    // .limit(limit)
    .exec(function (err, faq) {
      if (err) callback(err);
      callback(null, faq);
    });
  }], function (err, faq) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Faq/productIndex", {
      faq: faq,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); 
// 상품 index


router.get("/new", function (req, res) {
  return res.render("PlinicAdmin/Contents/Comments/Faq/new", {
    user: req.user
  });
});
// FAQ 게시판 답변 화면


router.post('/faqCreate', s3upload.fields([
  { name: 'image' }]), isLoggedIn, function (req, res, next) {
    async.waterfall([function (callback) {
      FaqCounter.findOne({
        name: "faqComments"
      }, function (err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          FaqCounter.create({
            name: "faqComments",
            totalCount: 0
          }, function (err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function (callback, counter) {
      var newPost = req.body.post;
      newPost.author = req.user._id;
      newPost.numId = counter.totalCount + 1;
      Faq.create(req.body.post, function (err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        counter.totalCount++;
        counter.save();
        res.redirect('/faqComments/');
      });
    });
});
// FAQ 게시판 생성


router.get('/:id/edit', isLoggedIn, function (req, res) {
  Faq.findById(req.params.id, function (err, post) {

    if (err) return res.json({
      success: false,
      message: err
    });
    res.render("PlinicAdmin/Contents/Comments/Faq/edit", {
      post: post,
      user: req.user
    });
  });
});
// FAQ 게시판 수정 화면


router.put('/:id', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), isLoggedIn, function (req, res, next) {
  req.body.post.updatedAt = Date.now();
  // req.body.post.prodfilename = req.files['prodimage'][0].key;
  // req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;

  var params = {
    Bucket: 'plinic',
    Delete: { // required
      Objects: [ // required
        {
          Key: req.body.prefilename // required
        },
        {
          Key: req.body.preprodfilename // required
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
    Faq.findOneAndUpdate({
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
      res.redirect('/faqComments/' + req.params.id);
    });
  });
}); 
// FAQ 게시판 업데이트


router.delete('/:id', isLoggedIn, function (req, res, next) {
  console.log(req);
  Faq.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function (err, post) {
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
    s3.deleteObjects(params, function (err, data) {
      console.log()
      if (err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/faqComments/');
  });
}); 
// FAQ 게시판 삭제


router.get("/:id", function (req, res) {
  Faq.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      var homeImage = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.homeimage_filename;
      var challenge_url1 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image1_filename;
      var challenge_url2 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image2_filename;
      var challenge_url3 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image3_filename;
      var challenge_url4 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image4_filename;
      var challenge_url5 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image5_filename;
      res.render("PlinicAdmin/Contents/Comments/Faq/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        homeImage: homeImage,
        challenge_url1: challenge_url1,
        challenge_url2: challenge_url2,
        challenge_url3: challenge_url3,
        challenge_url4: challenge_url4,
        challenge_url5: challenge_url5,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); 
// faq Show 페이지


router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  Faq.findOneAndUpdate({
    _id: req.params.id
  }, {
    $push: {
      comments: newComment
    }
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    res.redirect('/faqComments/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); 
// 댓글 작성


router.delete('/:postId/:commentId/commentsDel', function(req, res) {
  Faq.findOneAndUpdate({
      _id: req.params.postId
    }, {
      $pull: {
        comments: {
          _id: req.params.commentId
        }
      }
    },
    function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      res.redirect('/faqComments/' + req.params.postId + "?" +
        req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
    });
}); 
// 댓글 삭제


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
    if (searchTypes.indexOf("category") >= 0) {
      postQueries.push({
        category: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.category = queries.searchText;
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
