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
    .sort({ "seq": 1, "updatedAt": -1 })
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
    return res.render("PlinicAdmin/Product/ProductData/ProductQnA/index", {
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
}); // index

// router.get('/', function (req, res) {
//   var vistorCounter = null;
//   var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
//   var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
//   var search = createSearch(req.query);
//   async.waterfall([
//     function (callback) {
//       FaqCounter.findOne({
//       name: "faq"
//     }, function (err, counter) {
//       if (err) callback(err);
//       vistorCounter = counter;
//       callback(null);
//     });
//   }, 
//   function (callback) {
//     if (!search.findUser) return callback(null);
//     Faq.find(search.findUser, function (err, users) {
//       if (err) callback(err);
//       var or = [];
//       users.forEach(function (user) {
//         or.push({
//           author: mongoose.Types.ObjectId(user._id)
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
//   }, 
//   function (callback) {
//     if (search.findUser && !search.findPost.$or) return callback(null, null, null, 0);
//     Faq.count(search.findPost, function (err, count) {
//       if (err) callback(err);
//       skip = (page - 1) * limit;
//       maxPage = Math.ceil(count / limit);
//       callback(null, skip, maxPage);
//     });
//   }, 
//   function (skip, maxPage, callback) {
//     if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
//     Faq.aggregate([
//       // { $match: { _id : mongoose.Types.ObjectId(req.params.id)}},
//       {$match: {"category": '[상품]'}},
//       {$sort : 
//         {createdAt: -1}
//     }
//     ],function (err, faq) {
//       if (err) callback(err);
//       callback(null, faq, maxPage);
//     });
//   }
// ], 
// function (err, faq, maxPage) {
//     if (err) return res.json({
//       success: false,
//       message: err
//     });
//     return res.render("PlinicAdmin/Product/ProductData/ProductQnA/index", {
//       faq: faq,
//       user: req.user,
//       page: page,
//       maxPage: maxPage,
//       urlQuery: req._parsedUrl.query,
//       search: search,
//       counter: vistorCounter,
//       postsMessage: req.flash("postsMessage")[0]
//     });
//   });
// }); // new index

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
      res.render("PlinicAdmin/Product/ProductData/ProductQnA/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        homeImage: homeImage,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); //productQnA Show 페이지

router.delete('/del/:id', isLoggedIn, function(req, res, next) {
  Faq.findOneAndRemove({
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
    res.redirect('/productQnA/');
  });
}); // productQnA 게시판 삭제

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
    res.redirect('/productQnA/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //댓글 작성

router.post('/:id/:commentId/commentsDel/', function (req, res) {
  console.log(req.body);
  Faq.findOneAndUpdate(
    {
      // _id: '60b6fa0c0a2b3bdacf8227f9',
      "comments._id": req.params.commentId
    },
    {
      $set: {
        comments: req.body.comments
      }
    },
    req.body,
    function (err, recomments) {
      console.log(recomments);
      res.redirect('/productQnA/' + req.params.id + "?" + req._parsedUrl.query);
    });
}); //댓글 삭제

router.get("/ProductData/ProductQnA/new", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductQnA/new", {});
});
//상품데이터 문의관리 new

router.get("/ProductData/ProductQnA/edit", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductQnA/edit", {});
});
//상품데이터 문의관리 edit



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
