var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var User = require("../models/user");
var Orders = require("../models/Orders");
var UserCounter = require("../models/UserCounter");
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
var multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { search } = require("./product");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();

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
  return res.render("PlinicAdmin/Operation/Main/index", {});
});
//고객 관리 메인 화면

router.get('/', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 80;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);
  async.waterfall([
    function(callback) {
    if (!search.findUser) return callback(null);
    User.find(search.findUser, function(err, users) {
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
      if (search.findUser && !search.findPost.$or 
        || testSearch.findUser && testSearch.dayCreated[0].created) 
      return callback(null, null, 0);
      User.count(search.findPost || testSearch.dayCreated[0].created, function(err, count) {
        if (err) callback(err);
        skip = (page - 1) * limit;
        maxPage = Math.ceil(count / limit);
        callback(null, skip, maxPage);
      });

  }, 
  function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or 
      || testSearch.findUser && testSearch.dayCreated[0].created) 
    return callback(null, [], 0);

    if(testSearch.dayCreated[0]) {
      User.find(testSearch.dayCreated[0])
      .populate("author")
      .sort({created : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user, maxPage);
      });
    } else {
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
  },
  ], 
  function(err, user, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/MemberMgt/index", {
      users: user,
      // orders: orders,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      testSearch : testSearch,
      // dateSearch: dateSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
});

router.get('/newIndex', function(req, res) {
  var vistorCounter = null;
  // var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  // var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 80;
  var search = createSearch2(req.query);
  var testSearch = createSearchDate(req.query);
  var dateSearch = createSearchDate2(req.query);
  async.waterfall([
    function(callback) {
    if (!search.findUser) return callback(null);
    User.find(search.findUser, function(err, users) {
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
      if (search.findUser && !search.findPost.$or 
        || testSearch.findUser && testSearch.dayCreated[0].created
        || dateSearch.findUser && dateSearch.dayCreated[0].updatedAt) 
      return callback(null, null, 0);
      User.count(search.findPost || testSearch.dayCreated[0].created || dateSearch.dayCreated[0].updatedAt, function(err, count) {
        if (err) callback(err);
        // skip = (page - 1) * limit;
        // maxPage = Math.ceil(count / limit);
        callback(null);
      });

  }, 
  function( callback) {
    if (search.findUser && !search.findPost.$or 
      || testSearch.findUser && testSearch.dayCreated[0].created
      || dateSearch.findUser && dateSearch.dayCreated[0].updatedAt) 
    return callback(null, [], 0);

    if(testSearch.dayCreated[0]) {
      User.find(testSearch.dayCreated[0])
      .populate("author")
      .sort({created : 1})
      // .skip(skip)
      // .limit(limit)
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user);
      });
    } else if(dateSearch.dayCreated[0]) {
      User.find(dateSearch.dayCreated[0])
      .populate("author")
      .sort({updatedAt : 1})
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user);
      });
    } else {
      User.find(search.findPost)
      .populate("author")
      .sort({created : -1})
      // .skip(skip)
      // .limit(limit)
      .exec(function(err, user) {
        if (err) callback(err);
        callback(null, user);
      });
    }
  },
  ], 
  function(err, user) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Operation/MemberMgt/newIndex", {
      users: user,
      // orders: orders,
      user: req.user,
      // page: page,
      // maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      testSearch: testSearch,
      dateSearch: dateSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
});



router.get("/:id", function (req, res) {
  
  // if(User.findById(req.params.id) && Orders.findById(req.params.id)) {
    User.findById(req.params.id)
    .populate(['author', 'orders'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      res.render("PlinicAdmin/Operation/MemberMgt/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 회원 정보 show

router.get("/test", function (req, res) {
  
    // User.findById(req.params.id)
    Orders.findAll({
      where: {user: req.user}, //조건
      include: [{ //포험
        model: User, //어느 부분인지
        attributes : ['_id'] //속성
      }],
    })
    .populate(['author', 'orders'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      res.render("PlinicAdmin/Operation/MemberMgt/oshow", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 회원 정보 show

// router.get("/orders/test", function (req, res) {
//   // SkinQna.find(
//   //   {
//   //     // "comments.recomments._id": "60c054ac180b5f136d24a502",
//   //     "comments.$.recomments": req.body.recomments,
//   //     'comments.recomments.isDelete': false
//   //   },
//   User.findAll({
//     // where: {user: req.user}, //조건
//     // include: [{ //포험
//     //   model: Orders, //어느 부분인지
//     //   attributes : ['_id'] //속성
//     // }],
//   },
//      function (err, docs) {
//       if (err) {
//         console.log(err);
//       }
//       if (docs) {
//         console.log(docs);
//         res.json(docs);
//       }
//     })
// });


router.delete('/rowdel/:id', isLoggedIn, function(req, res, next) {
  User.findOneAndRemove({
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
    res.redirect('/members/');
  });
}); //row 삭제


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;

// index
// 가입 기간
function createSearchTest(querie) {
  findUser = null
  if (!isEmpty2(querie.termCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated : dayCreated
    };

  } else {

    var dayCreated = [];
    var findAfter = {
      all : false,
      weeklyy: false,
      monthy: false,
    };
    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          created: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }


    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated: dayCreated
    };
  }
  
}
// 회원 검색
function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 2) { //검색어 글자수 제한 하는 것
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("email") >= 0) {
      postQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.email = queries.searchText;
    }
    if (searchTypes.indexOf("name") >= 0) {
      postQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.name = queries.searchText;
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
    if (postQueries.length > 0) findPost = {
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

// newIndex
// 가입 기간
function createSearchDate(querie) {
  findUser = null
  if (!isEmpty2(querie.dateCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(querie.dateCheck)) {
      // var created = new Date();

      if(isEmpty2(!querie.dateCheck.january)) {
        var januaryStart   = new Date( "2020", "12" );
        var start12   = new Date( "2021", "01" );
        januaryLast = new Date(start12 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: januaryStart,
            $lte: januaryLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.february)) {
        var februaryStart   = new Date( "2021", "01" );
        var start11   = new Date( "2021", "02" );
        februaryLast = new Date(start11 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: februaryStart,
            $lte: februaryLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.march)) {
        var marchStart   = new Date( "2021", "02" );
        var start10   = new Date( "2021", "03" );
        marchLast = new Date(start10 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: marchStart,
            $lte: marchLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.april)) {
        var aprilStart   = new Date( "2021", "03" );
        var start9   = new Date( "2021", "04" );
        aprilLast = new Date(start9 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: aprilStart,
            $lte: aprilLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.may)) {
        var mayStart   = new Date( "2021", "04" );
        var start   = new Date( "2021", "05" );
        mayLast = new Date(start -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: mayStart,
            $lte: mayLast,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!querie.dateCheck.jun)) {
        var junStart   = new Date( "2021", "05" );
        var start2   = new Date( "2021", "06" );
        junLast = new Date(start2 -1);
        // var junLast = start2.setDate(start2.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: junStart,
            $lte: junLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.jul)) {
        var julStart   = new Date( "2021", "06" );
        var start3   = new Date( "2021", "07" );
        julLast = new Date(start3 -1);
        // var julLast = start3.setDate(start3.getDate() - 1);

        dayCreated.push({
          created: {
            $gte: julStart,
            $lte: julLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.aug)) {
        var augStart   = new Date( "2021", "07" );
        var start4   = new Date( "2021", "08" );
        augLast = new Date(start4 -1);
        // var augLast = start4.setDate(start4.getDate() - 1);

        dayCreated.push({
          created: {
            $gte: augStart,
            $lte: augLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.september)) {
        var septemberStart   = new Date( "2021", "08" );
        var start5   = new Date( "2021", "09" );
        septemberLast = new Date(start5 -1);

        dayCreated.push({
          created: {
            $gte: septemberStart,
            $lte: septemberLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.october)) {
        var octoberStart   = new Date( "2021", "09" );
        var start6   = new Date( "2021", "10" );
        octoberLast = new Date(start6 -1);

        dayCreated.push({
          created: {
            $gte: octoberStart,
            $lte: octoberLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.november)) {
        var novemberStart   = new Date( "2021", "10" );
        var start7   = new Date( "2021", "11" );
        novemberLast = new Date(start7 -1);

        dayCreated.push({
          created: {
            $gte: novemberStart,
            $lte: novemberLast,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.dateCheck.december)) {
        var decemberStart   = new Date( "2021", "11" );
        var start8   = new Date( "2021", "12" );
        decemberLast = new Date(start8 -1);

        dayCreated.push({
          created: {
            $gte: decemberStart,
            $lte: decemberLast,
          }
        });
      } else {
        dayCreated.push();
      }
      isEmpty2(!querie.dateCheck.january) ? findAfter.january = true : findAfter.january = false;
      isEmpty2(!querie.dateCheck.february) ? findAfter.february = true : findAfter.february = false;
      isEmpty2(!querie.dateCheck.march) ? findAfter.march = true : findAfter.march = false;
      isEmpty2(!querie.dateCheck.april) ? findAfter.april = true : findAfter.april = false;
      isEmpty2(!querie.dateCheck.may) ? findAfter.may = true : findAfter.may = false;
      isEmpty2(!querie.dateCheck.jun) ? findAfter.jun = true : findAfter.jun = false;
      isEmpty2(!querie.dateCheck.jul) ? findAfter.jul = true : findAfter.jul = false;
      isEmpty2(!querie.dateCheck.aug) ? findAfter.aug = true : findAfter.aug = false;
      isEmpty2(!querie.dateCheck.september) ? findAfter.september = true : findAfter.september = false;
      isEmpty2(!querie.dateCheck.october) ? findAfter.october = true : findAfter.october = false;
      isEmpty2(!querie.dateCheck.november) ? findAfter.november = true : findAfter.november = false;
      isEmpty2(!querie.dateCheck.december) ? findAfter.december = true : findAfter.december = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated : dayCreated
    };

  } else {

    var dayCreated = [];
    var findAfter = {
      january: false,
      february: false,
      march: false,
      april: false,
      may : false,
      jun: false,
      jul: false,
      aug: false,
      september: false,
      october: false,
      november: false,
      december: false,
    };
    if (!isEmpty2(querie.dateCheck)) {
      // var created = new Date();

      if(isEmpty2(!querie.dateCheck.january)) {
        var januaryStart   = new Date( "2020", "12" );
        var start12   = new Date( "2021", "01" );
        januaryLast = new Date(start12 -12);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: januaryStart,
            $lte: januaryLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.february)) {
        var februaryStart   = new Date( "2021", "01" );
        var start11   = new Date( "2021", "02" );
        februaryLast = new Date(start11 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: februaryStart,
            $lte: februaryLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.march)) {
        var marchStart   = new Date( "2021", "02" );
        var start10   = new Date( "2021", "03" );
        marchLast = new Date(start10 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: marchStart,
            $lte: marchLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.april)) {
        var aprilStart   = new Date( "2021", "03" );
        var start9   = new Date( "2021", "04" );
        aprilLast = new Date(start9 -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: aprilStart,
            $lte: aprilLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.may)) {
        var mayStart   = new Date( "2021", "04" );
        var start   = new Date( "2021", "05" );
        mayLast = new Date(start -1);
        // var mayLast = start.setDate(start.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: mayStart,
            $lte: mayLast,
          }
        });
      } else {
      }
  
      if(isEmpty2(!querie.dateCheck.jun)) {
        var junStart   = new Date( "2021", "05" );
        var start2   = new Date( "2021", "06" );
        junLast = new Date(start2 -1);
        // var junLast = start2.setDate(start2.getDate() - 1);
        
        dayCreated.push({
          created: {
            $gte: junStart,
            $lte: junLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.jul)) {
        var julStart   = new Date( "2021", "06" );
        var start3   = new Date( "2021", "07" );
        julLast = new Date(start3 -1);
        // var julLast = start3.setDate(start3.getDate() - 1);

        dayCreated.push({
          created: {
            $gte: julStart,
            $lte: julLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.aug)) {
        var augStart   = new Date( "2021", "07" );
        var start4   = new Date( "2021", "08" );
        augLast = new Date(start4 -1);
        // var augLast = start4.setDate(start4.getDate() - 1);

        dayCreated.push({
          created: {
            $gte: augStart,
            $lte: augLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.september)) {
        var septemberStart   = new Date( "2021", "08" );
        var start5   = new Date( "2021", "09" );
        septemberLast = new Date(start5 -1);

        dayCreated.push({
          created: {
            $gte: septemberStart,
            $lte: septemberLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.october)) {
        var octoberStart   = new Date( "2021", "09" );
        var start6   = new Date( "2021", "10" );
        octoberLast = new Date(start6 -1);

        dayCreated.push({
          created: {
            $gte: octoberStart,
            $lte: octoberLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.november)) {
        var novemberStart   = new Date( "2021", "10" );
        var start7   = new Date( "2021", "11" );
        novemberLast = new Date(start7 -1);

        dayCreated.push({
          created: {
            $gte: novemberStart,
            $lte: novemberLast,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.dateCheck.december)) {
        var decemberStart   = new Date( "2021", "10" );
        var start8   = new Date( "2021", "11" );
        decemberLast = new Date(start8 -1);

        dayCreated.push({
          created: {
            $gte: decemberStart,
            $lte: decemberLast,
          }
        });
      } else {
      }
      isEmpty2(!querie.dateCheck.january) ? findAfter.january = true : findAfter.january = false;
      isEmpty2(!querie.dateCheck.february) ? findAfter.february = true : findAfter.february = false;
      isEmpty2(!querie.dateCheck.march) ? findAfter.march = true : findAfter.march = false;
      isEmpty2(!querie.dateCheck.april) ? findAfter.april = true : findAfter.april = false;
      isEmpty2(!querie.dateCheck.may) ? findAfter.may = true : findAfter.may = false;
      isEmpty2(!querie.dateCheck.jun) ? findAfter.jun = true : findAfter.jun = false;
      isEmpty2(!querie.dateCheck.jul) ? findAfter.jul = true : findAfter.jul = false;
      isEmpty2(!querie.dateCheck.aug) ? findAfter.aug = true : findAfter.aug = false;
      isEmpty2(!querie.dateCheck.september) ? findAfter.september = true : findAfter.september = false;
      isEmpty2(!querie.dateCheck.october) ? findAfter.october = true : findAfter.october = false;
      isEmpty2(!querie.dateCheck.november) ? findAfter.november = true : findAfter.november = false;
      isEmpty2(!querie.dateCheck.december) ? findAfter.december = true : findAfter.december = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated: dayCreated
    };
  }
  
}
// 회원 검색
function createSearch2(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 2) { //검색어 글자수 제한 하는 것
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("email") >= 0) {
      postQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.email = queries.searchText;
    }
    if (searchTypes.indexOf("name") >= 0) {
      postQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.name = queries.searchText;
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
    if (postQueries.length > 0) findPost = {
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
// 월간 사용자 수
function createSearchDate2(querie) {
  findUser = null
  if (!isEmpty2(querie.dateChecks)) {
    var dayCreated = [];//기간별 조희
    var findAfters = {
    };

    if (!isEmpty2(querie.dateChecks)) {
      // var created = new Date();

      if(isEmpty2(!querie.dateChecks.startDate && !querie.dateChecks.endDate)) {
        // var startDate = startDate.setDate(startDate.getDate());
        // var endDate = endDate.setDate(endDate.getDate());
        dayCreated.push({
          updatedAt: {
            $gte: querie.dateChecks.startDate,
            $lte: querie.dateChecks.endDate,
          }
        });
      } else {
        dayCreated.push();
      }

      isEmpty2(!querie.dateChecks.january) ? findAfters.january = true : findAfters.january = false;
    }

    return {
      findUser: findUser,
      findAfters: findAfters,
      dayCreated : dayCreated
    };

  } else {

    var dayCreated = [];
    var findAfters = {
      january: false,
    };
    if (!isEmpty2(querie.dateChecks)) {
      // var created = new Date();

      if(isEmpty2(!querie.dateChecks.startDate && !querie.dateChecks.endDate)) {
        // var startDate = startDate.setDate(startDate.getDate());
        // var endDate = endDate.setDate(endDate.getDate());
      dayCreated.push({
        updatedAt: {
          $gte: querie.dateChecks.startDate,
          $lte: querie.dateChecks.endDate,
        }
      });
    } else {
    }

      isEmpty2(!querie.dateChecks.january) ? findAfters.january = true : findAfters.january = false;
    }

    return {
      findUser: findUser,
      findAfters: findAfters,
      dayCreated: dayCreated
    };
  }
  
}

function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}