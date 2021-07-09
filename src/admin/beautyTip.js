var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Carezone = require("../models/Carezone");
var CarezoneCounter = require("../models/CarezoneCounter");
var CommuBeauty = require("../models/CommuBeauty");
var CommuBeautyCounter = require("../models/CommuBeautyCounter");
var User_admin = require("../models/User_admin");
var async = require("async");
var multer = require("multer");
// var FTPStorage = require('multer-ftp');
var sftpStorage = require("multer-sftp");
var path = require("path");
var FCM = require("fcm-node");
var serverKey = "AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU";
var fcm = new FCM(serverKey);

var multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();
let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "plinic",
    metadata: function(req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + "-" + Date.now()
      });
    },
    key: function(req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now());
    },
    acl: "public-read"
  })
});

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

router.get("/PostMgt/index", function(req, res) {
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
}); // index

router.get("/", function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10;
  var search = createSearchTest(req.query);
  async.waterfall(
    [
      // function(callback) {
      //   CommuBeautyCounter.findOne(
      //     {
      //       name: "postMgt"
      //     },
      //     function(err, counter) {
      //       if (err) callback(err);
      //       vistorCounter = counter;
      //       callback(null);
      //     }
      //   );
      // },
      // function(callback) {
      //   if (!search.findUser) return callback(null);
      //   User_admin.find(search.findUser, function(err, users) {
      //     if (err) callback(err);
      //     var or = [];
      //     users.forEach(function(user) {
      //       or.push({
      //         author: mongoose.Types.ObjectId(user._id)
      //       });
      //     });
      //     if (search.findPost.$or) {
      //       search.findPost.$or = search.findPost.$or.concat(or);
      //     } else if (or.length > 0) {
      //       search.findPost = {
      //         $or: or
      //       };
      //     }
      //     callback(null);
      //   });
      // },
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

        if(search.sortViews[0]) {
          CommuBeauty.find(search.findPost)
          .sort(search.sortViews[0])
          .populate("author")
          .sort(search.sortViews[0])
          .skip(skip)
          .limit(limit)
          .exec(function(err, commuBeauty) {
            if (err) callback(err);
            callback(null, commuBeauty, maxPage);
          });
        } else {
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
        postsMessage: req.flash("postsMessage")[0],
      });
    }
  );
}); // Search Test

router.post("/BeautyTip/PostMgt",s3upload.fields([{name: "image"}]),isLoggedIn,function(req, res, next) {

    showLocation = req.body.showLocation
    // req.body.post.filename = req.file.key;
    // req.body.post.originalName = req.file.originalname;
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
        // req.body.post.filename = req.file.key;
        // req.body.post.originalName = req.file.originalname;
        req.body.post.filename = req.files["image"][0].key;
        req.body.post.originalName = req.files["image"][0].originalname;
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

router.get("/CommuBeauty/:id", function(req, res) {
  CommuBeauty.findById(req.params.id)
    .populate(["author", "comments.author"])
    .exec(function(err, post) {
      if (err)
        return res.json({
          success: false,
          message: err
        });
      post.views++;
      post.save();

      //배너 이미지 가져 오기 20190502
      //res.setHeader('Content-Type', 'image/jpeg');
      var url =
        "https://plinic.s3.ap-northeast-2.amazonaws.com/" + post.filename;
      res.render("PlinicAdmin/Contents/BeautyTip/PostMgt/show", {
        post: post,
        url: url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        prefilename: post.filename,
        search: createSearch(req.query)
      });
    });
});
//콘텐츠관리 챌린지 Show

router.get("/:id/edit", isLoggedIn, function(req, res) {
  CommuBeauty.findById(req.params.id, function(err, post) {
    var url = "https://plinic.s3.ap-northeast-2.amazonaws.com/" + post.filename;

    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    if (err)
      return res.json({
        success: false,
        message: err
      });
    // if (!req.user._id.equals(post.author)) return res.json({
    //   success: false,
    //   message: "Unauthrized Attempt"
    // });
    res.render("PlinicAdmin/Contents/BeautyTip/PostMgt/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      url: url,
      user: req.user
    });
  });
}); // 콘텐츠관리 챌린지 edit

router.put("/:id", s3upload.fields([{name:'image'}]), isLoggedIn, function(
  req,
  res,
  next
) {
  req.body.post.updatedAt = Date.now();
  // req.body.post.filename = req.file.key;

  if (req.files['image']) {
    req.body.post.filename = req.files['image'][0].key;
    req.body.post.originalName = req.files['image'][0].originalname;
  }

  req.body.post.showLocation = req.body.showLocation;
  req.body.post.tabLocation = req.body.tabLocation;

  var params = {
    Bucket: "plinic",
    Delete: {
      // required
      Objects: [
        // required
        {
          Key: req.body.prefilename // required
        }
      ]
    }
  };
  s3.deleteObjects(params, function(err, data) {
    if (err) {
      console.log(
        "케어존 수정 아마존 파일 삭제 에러 : " +
          req.body.prefilename +
          "err : " +
          err
      );
      res.status(500);
    } else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    CommuBeauty.findOneAndUpdate(
      {
        _id: req.params.id
        // author: req.user._id
      },
      req.body.post,
      function(err, post) {
        if (err)
          return res.json({
            success: false,
            message: err
          });
        if (!post)
          return res.json({
            success: false,
            message: "No data found to update"
          });
        res.redirect("/beautyTip/CommuBeauty/" + req.params.id);
      }
    );
  });
}); //update

router.delete('/:id', isLoggedIn, function(req, res, next) {
  CommuBeauty.findOneAndRemove({
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
    res.redirect('/beautyTip/PostMgt/index');
  });
}); //destroy

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;

function createSearchTest(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (!isEmpty2(queries.searchCheck)) {
    //검색어 글자수 제한 하는 것
    // var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    var sortViews = []; //정렬순 조희
    var findAfter = {
      home : false,
      poreSize : false,
      poreCount : false,
      skinTone : false,
      clean : false,
      munjin : false,
      editor : false,
      tip: false,
      hit: false,
      new: false
    };
    // if (searchTypes.indexOf("body") >= 0) {

    isEmpty2(!queries.searchCheck.home) ? postQueries.push({'showLocation.home' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.poreSize) ? postQueries.push({'showLocation.poreSize' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.poreCount) ? postQueries.push({'showLocation.poreCount' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.skinTone) ? postQueries.push({'showLocation.skinTone' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.clean) ? postQueries.push({'showLocation.clean' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.munjin) ? postQueries.push({'showLocation.munjin' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.editor) ? postQueries.push({'showLocation.editor' : true}) : postQueries.push();

    isEmpty2(!queries.searchCheck.home) ? findAfter.home = true : findAfter.home = false;
    isEmpty2(!queries.searchCheck.poreSize) ? findAfter.poreSize = true : findAfter.poreSize = false;
    isEmpty2(!queries.searchCheck.poreCount) ? findAfter.poreCount = true : findAfter.poreCount = false;
    isEmpty2(!queries.searchCheck.skinTone) ? findAfter.skinTone = true : findAfter.skinTone = false;
    isEmpty2(!queries.searchCheck.clean) ? findAfter.clean = true : findAfter.clean = false;
    isEmpty2(!queries.searchCheck.munjin) ? findAfter.munjin = true : findAfter.munjin = false;
    isEmpty2(!queries.searchCheck.editor) ? findAfter.editor = true : findAfter.editor = false;

    isEmpty2(!queries.searchCheck.tip) ? postQueries.push({'tabLocation.tip' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.hit) ? postQueries.push({'tabLocation.hit' : true}) : postQueries.push();
    isEmpty2(!queries.searchCheck.new) ? postQueries.push({'tabLocation.new' : true}) : postQueries.push();

    

    // isEmpty2(!queries.searchCheck.downView) ? sortViews.push({views : -1}) : sortViews.push();
    // isEmpty2(!queries.searchCheck.munjin) ? postQueries.push({'tabLocation.munjin' : true}) : postQueries.push({'tabLocation.munjin' : false});
    // isEmpty2(!queries.searchCheck.editor) ? postQueries.push({'tabLocation.editor' : true}) : postQueries.push({'tabLocation.editor' : false});

    isEmpty2(!queries.searchCheck.tip) ? findAfter.tip = true : findAfter.tip = false;
    isEmpty2(!queries.searchCheck.hit) ? findAfter.hit = true : findAfter.hit = false;
    isEmpty2(!queries.searchCheck.new) ? findAfter.new = true : findAfter.new = false;
    
    // isEmpty2(!queries.searchCheck.upView) ? findAfter.skinTone = true : findAfter.skinTone = false;
    // isEmpty2(!queries.searchCheck.downView) ? findAfter.clean = true : findAfter.clean = false;
    // isEmpty2(!queries.searchCheck.munjin) ? findAfter.munjin = true : findAfter.munjin = false;
    // isEmpty2(!queries.searchCheck.editor) ? findAfter.editor = true : findAfter.editor = false;
    
    findPost = {
      $or: postQueries
    };

    if (!isEmpty2(queries.sortCheck)) {

      if(isEmpty2(!queries.sortCheck.upView)) {
        sortViews.push({views : -1});
        postQueries.push();
      } else {
        sortViews.push();
        postQueries.push();
      }
  
      if(isEmpty2(!queries.sortCheck.downView)) {
        sortViews.push({views : 1});
        postQueries.push();
      } else {
        sortViews.push();
        postQueries.push();
      }
      isEmpty2(!queries.sortCheck.upView) ? findAfter.upView = true : findAfter.upView = false;
      isEmpty2(!queries.sortCheck.downView) ? findAfter.downView = true : findAfter.downView = false;
    }

    return {
      searchText: queries.searchCheck,
      findPost: findPost,
      findUser: findUser,
      highlight: highlight,
      findAfter: findAfter,
      sortViews : sortViews
    };

  } else {
    var searchCheck = {
      home : false,
      poreSize : false,
      poreCount : false,
      skinTone : false,
      clean : false,
      munjin : false,
      home : false,
    }

    var postQueries = [];
    var sortViews = [];
    var findAfter = {
      home : false,
      poreSize : false,
      poreCount : false,
      skinTone : false,
      clean : false,
      munjin : false,
      editor : false,
    };
    postQueries.push({'showLocation.home' : false});
    postQueries.push({'showLocation.poreSize' : false});
    postQueries.push({'showLocation.poreCount' : false});
    postQueries.push({'showLocation.skinTone' : false});
    postQueries.push({'showLocation.clean' : false});
    postQueries.push({'showLocation.munjin' : false});
    postQueries.push({'showLocation.editor' : false});
    postQueries.push({'tabLocation.tip' : false});
    postQueries.push({'tabLocation.hit' : false});
    postQueries.push({'tabLocation.new' : false});

    findAfter.home = false;
    findAfter.poreSize = false;
    findAfter.poreCount = false;
    findAfter.skinTone = false;
    findAfter.clean = false;
    findAfter.munjin = false;
    findAfter.editor = false;
    findAfter.tip = false;
    findAfter.hit = false;
    findAfter.new = false;

    if (!isEmpty2(queries.sortCheck)) {

      if(isEmpty2(!queries.sortCheck.upView)) {
        sortViews.push({views : -1});
        // postQueries.push();
      } else {
        // postQueries.push();
      }
  
      if(isEmpty2(!queries.sortCheck.downView)) {
        sortViews.push({views : 1});
        // postQueries.push();
      } else {
        // postQueries.push();
      }
      isEmpty2(!queries.sortCheck.upView) ? findAfter.upView = true : findAfter.upView = false;
      isEmpty2(!queries.sortCheck.downView) ? findAfter.downView = true : findAfter.downView = false;
    }


    return {
      searchType: queries.searchType,
      searchText: queries.searchText,
      findPost: findPost,
      findUser: findUser,
      findAfter: findAfter,
      highlight: highlight,
      sortViews: sortViews
    };
  }
  
}

function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if ( queries.searchType && queries.searchText && queries.searchText.length >= 2) {
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

function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}
