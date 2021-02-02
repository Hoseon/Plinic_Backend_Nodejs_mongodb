var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Qna = require("../models/Qna");
var QnaCounter = require("../models/QnaCounter");
var Carezone = require("../models/Carezone");
var CarezoneCounter = require("../models/CarezoneCounter");
var Notice = require("../models/Notice");
var NoticeCounter = require("../models/NoticeCounter");
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

//////////////////////////// Guide ///////////

router.get('/', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);

  async.waterfall([function (callback) {
    NoticeCounter.findOne({
      name: "notice"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function (callback) {
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
    Notice.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Notice.find(search.findPost).sort({ "seq": 1 }).populate("author").sort({ "seq": 1, "updatedAt": -1 }).skip(skip).limit(limit).exec(function (err, notice) {
      if (err) callback(err);
      callback(null, notice, maxPage);
    });
  }], function (err, notice, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/Notice/index", {
      post : notice,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // Real index

router.get('/new', isLoggedIn, function(req, res) {
  res.render("PlinicAdmin/Contents/Comments/Notice/new", {
    user: req.user
  });
}); // new

router.post('/', s3upload.fields([
  { name: 'image' }]), isLoggedIn, function (req, res, next) {
    async.waterfall([function (callback) {
      NoticeCounter.findOne({
        name: "noticeComments"
      }, function (err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          NoticeCounter.create({
            name: "noticeComments",
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
      req.body.post.filename = req.files['image'][0].key;
      req.body.post.originalName = req.files['image'][0].originalname;
      Notice.create(req.body.post, function (err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        counter.totalCount++;
        counter.save();
        res.redirect('/noticeComments/');
      });
    });
  }); // create

router.delete('/:id', isLoggedIn, function (req, res, next) {
  console.log(req);
  Notice.findOneAndRemove({
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
    res.redirect('/noticeComments/');
  });
}); //destroy

router.get("/:id", function (req, res) {
  Notice.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      //이미지 가져 오기 
      //res.setHeader('Content-Type', 'image/jpeg');
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      // console.log(post.day);
      res.render("PlinicAdmin/Contents/Comments/Notice/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); //Show

// router.get("/comments/:id/:commentId", function (req, res) {

//   Notice.aggregate([
//     { $match: { _id : mongoose.Types.ObjectId(req.params.id)}},
//     { $unwind: "$comments" },
//     { $match: { "comments._id": mongoose.Types.ObjectId(req.params.commentId) } },
//     { "$project": {
//         _id: "$comments._id",
//         title: "$comments.title",
//         body: "$comments.body",
//         name:"$comments.name",
//         comment: "$comments.comment",
//         updatedAt: "$comments.updatedAt",
//         commentId: req.params.id,
//       }
//     }

//   ])
//     .exec(function (err, post) {
//       if (err) return res.json({
//         success: false,
//         message: err
//       });
//       res.render("PlinicAdmin/Contents/Comments/Notice/show", {
//         post: post,
//         urlQuery: req._parsedUrl.query,
//         user: req.user,
//         search: createSearch(req.query),
//         postDate: getFormattedDate(post[0].updatedAt),
//       });
//     });
// });
//댓글 comments Show



router.post('/:id/comments', function(req, res) {
  var message = { 
    to: req.body.pushtoken,
    notification: {
      title: '문의하신 글에 댓글이 작성되었습니다.',
      body: req.body.comment.body,
      sound: "default",
      click_action: "FCM_PLUGIN_ACTIVITY",
    },

    data: { 
      mode: "mynotice",
      id: req.body.id
    }
  };

  fcm.send(message, function(err, response) {
    if (err) {
      console.log("Something has gone wrong!");
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });

  var newComment = req.body.comment;
  newComment.author = req.user._id;
  Notice.update({
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
    res.redirect('/noticeComments/' + req.params.id + "?" + req._parsedUrl.query);
  });
});
// 댓글 등록


router.post('/:id/recomments', function(req, res) {
  var message = { 
    to: req.body.pushtoken,
    notification: {
      title: '문의하신 글에 댓글이 작성되었습니다.',
      body: req.body.recomment.body,
      sound: "default",
      click_action: "FCM_PLUGIN_ACTIVITY",
    },

    data: { 
      mode: "mynotice",
      id: req.body.id
    }
  };

  fcm.send(message, function(err, response) {
    if (err) {
      console.log("Something has gone wrong!");
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });

  var newComment = req.body.recomment;
  newComment.author = req.user._id;
  Notice.update({
    _id: req.params.id
  }, {
    $push: {
      recomments: newComment
    }
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    res.redirect('/noticeComments/' + req.params.id + "?" + req._parsedUrl.query);
  });
});


// router.post('/recomments/:id/', function (req, res) {
//   console.log(req.body.post);
//   var newComment = req.body.post;
//   Notice.update({
//     "comments._id" : req.params.id
//   }, {
//     $push: {
//       "comments.$.recomments" : newComment
//     }
//   }, function(err, post) {
//     if (err) return res.json({
//       success: false,
//       message: err
//     });
      
//     res.redirect('/noticeComments/' + req.body.post.commentId + "?" + req.params.id);
//   });
// });


router.delete('/:postId/comments/:commentId', function(req, res) {
  Notice.update({
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
      res.redirect('/noticeComments/' + req.params.postId + "?" +
        req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
    });
}); 
//destroy a comment


router.get('/:id/edit', isLoggedIn, function (req, res) {
  Notice.findById(req.params.id, function (err, post) {
    // var url = req.protocol + '://' + req.get('host') + '/carezone_images/' + post._id;
    var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
    // var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;
    var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;

    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    var preprodfilename = post.prodfilename;
    var preprodoriginalname = post.prodoriginalname;

    if (err) return res.json({
      success: false,
      message: err
    });
    res.render("PlinicAdmin/Contents/Comments/Notice/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      preprodfilename: preprodfilename,
      preprodoriginalname: preprodoriginalname,
      url: url,
      prod_url: prod_url,
      user: req.user
    });
  });
}); // 콘텐츠관리 챌린지 edit

router.put('/:id', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), isLoggedIn, function (req, res, next) {
  req.body.post.updatedAt = Date.now();
  req.body.post.filename = req.files['image'][0].key;
  req.body.post.originalName = req.files['image'][0].originalname;
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
    Notice.findOneAndUpdate({
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
      res.redirect('/noticeComments/' + req.params.id);
    });
  });
}); //update

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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;