var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var SkinQna = require("../models/SkinQna");
var SkinQnaCounter = require("../models/SkinQnaCounter");
var Carezone = require("../models/Carezone");
var CarezoneCounter = require("../models/CarezoneCounter");
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
  // var newPost = req.body.post;
  // var commentSum = newPost.comments.length;
  // var recommentSum = newPost.comments.recomments.length;
  // var sum = commentSum + recommentSum

  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([function (callback) {
    SkinQnaCounter.findOne({
      name: "skinqna"
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
    SkinQna.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    SkinQna.find(search.findPost)
    .populate("author")
    .sort({ editor: -1 , "createdAt": -1})
    .skip(skip)
    .limit(limit)
    .exec(function (err, skinqna) {
      if (err) callback(err);
      callback(null, skinqna, maxPage);
    });
  }], function (err, skinqna, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/SkinQna/index", {
      skinqna: skinqna,
      // sum: sum,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // 피부고민 게시판 화면

router.post('/', s3upload.fields([{
  name: 'image'
}]), function(req, res, next) {
  async.waterfall([function(callback) {
    SkinQnaCounter.findOne({
      name: "skinqna"
    }, function(err, counter) {
      if (err) callback(err);
      if (counter) {
        callback(null, counter);
      } else {
        SkinQnaCounter.create({
          name: "skinqna",
          totalCount: 0
        }, function(err, counter) {
          if (err) return res.json({
            success: false,
            message: err
          });
          callback(null, counter);
        });
      }
    });
  }], function(callback, counter) {
    let newNote = SkinQna();
    newNote.email = req.body.email;
    newNote.select = req.body.select;
    newNote.title = req.body.title;
    newNote.contents = req.body.contents;
    newNote.pushtoken = req.body.pushtoken;
    newNote.tags = JSON.stringify(req.body.tags).replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
    newNote.numId = counter.totalCount + 1;
    newNote.filename = req.files['image'][0].key;
    newNote.originalName = req.files['image'][0].originalname;
    newNote.save((err, data) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          'msg': '뷰티노트가 등록되지 않았습니다. <br /> Error : ' + err
        });
      }
      
      if (data) {
        var isReview = false;
        for (var i = 0; i < data.point.length; i++) {
          if (getFormattedDate(data.point[i].createdAt) == getFormattedDate(new Date())) {
            if (data.point[i].reason == '뷰티플 글쓰기 작성') {
              // console.log(getFormattedDate(data.point[i].createdAt) + " : " + getFormattedDate(new Date()));
              isReview = true;
            }
          } 
        }

        if (isReview) { //오늘 톡을 작성한게 있다면 포인트 적립 없이 진행
          console.log("뷰티플 글쓰기 작성은 되었으나 포인트는 적립되지 않음");
        } else { //오늘 톡을 작성한게 있다면 포인트 적립 진행
          PointLog.update({
            email: req.body.email
          }, {
              $push: { point: prePointLog },
              $inc: { "totalPoint": 50 }
            }, (err, result) => {
              if (err) {
                console.log("글쓰기 포인트 적립 에러 발생 : " + req.body.email);
                res.status(400).json();
              }
              if (result) {
                // res.status(200).json(result);
              } else {
                console.log("글쓰기 포인트 적립 에러 발생 2 : " + req.body.email);
                res.status(400).json();
              }
          });
        }
      }
      var newTags = req.body.tags.replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
      Tags.update({
        _id: '5d2c39cc9cc12aae489d2f08'
      }, {
        $push: {
          tags: newTags
        }
      }, function(err, post2) {

      })
      return res.status(201).json(data);
    });
  });
  });

router.get('/:id', function(req, res) {
  SkinQna.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      //배너 이미지 가져 오기 20190502
      //res.setHeader('Content-Type', 'image/jpeg');
      // var url = req.protocol + '://' + req.get('host') + '/skinqnaimage/' + post._id;
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      // var url = req.protocol + '://' + 'plinic.cafe24app.com' + '/skinqnaimage/' + post._id;
      // var prod_url = req.protocol + '://' + req.get('host') + '/skinqna_prodimages/' + post._id;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("PlinicAdmin/Contents/Comments/SkinQna/show", {
        post: post,
        url: url,
        // sum: sum,
        // prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 피부고민 게시판 상세 화면

router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  SkinQna.findOneAndUpdate({
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
    res.redirect('/skinqnaComments/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //댓글 작성

router.post('/:commentId/:id/recomments/', function(req, res) {
  // console.log(req.body);
  var newComment = req.body.recomments;
  SkinQna.findOneAndUpdate({
    "comments._id" : req.params.commentId 
  }, {
    $push: {
      "comments.$.recomments" : newComment
    }
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    // return res.status(201).json({
    //   'msg': '커뮤니티 작성 포인트가 누적되었습니다!!'
    // });
    res.redirect('/skinqnaComments/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); // 대댓글 작성

router.post('/:id/recomments/:recommentId', function (req, res) {
  console.log(req.body);
  SkinQna.findOneAndUpdate(
    {
      // _id: '60b6fa0c0a2b3bdacf8227f9',
      "comments.recomments._id": req.params.recommentId
    },
    {
      $set: {
        "comments.$.recomments": req.body.recomments
      }
    },
    req.body,
    function (err, recomments) {
      console.log(recomments);
      res.redirect('/skinqnaComments/' + req.params.id + "?" + req._parsedUrl.query);
    });
}); //대댓글 삭제

// router.get('/skinCommentDel', function(req, res) {
//   //var carezonelist = null;
//   async.waterfall([function(callback) {
//     SkinQna.find({
//       'comments.recomments.isDelete': false
//     }, function(err, docs) {
//       res.json(docs);
//     })
//   }]);
// }); //대댓글 isDelete 필드 false일 때만 보여주기

router.post("/test", function (req, res) {
  SkinQna.find(
    {
      // "comments.recomments._id": "60c054ac180b5f136d24a502",
      "comments.$.recomments": req.body.recomments,
      'comments.recomments.isDelete': false
    },
     function (err, docs) {
      if (err) {
        console.log(err);
      }
      if (docs) {
        console.log(docs);
        res.json(docs);
      }
    })
});


router.post('/:id/editorUpdate', function (req, res, next) {

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
    SkinQna.findOneAndUpdate({
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
      res.redirect('/skinqnaComments/');
    });
  });
}); //베스트고민 update

router.delete('/del/:id', isLoggedIn, function(req, res, next) {
  SkinQna.findOneAndRemove({
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
    res.redirect('/skinqnaComments/');
  });
}); //게시글 삭제

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
