var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Carezone = require('./models/Carezone');
var CarezoneCounter = require('./models/CarezoneCounter');
var Mission = require('./models/Mission');
var async = require('async');
var User_admin = require('./models/User_admin');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var del = require('del');


//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
    //cb(null, UPLOAD_PATH)
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

let upload = multer({
  storage: storage
})

//20190617 미션 참여자 확인
router.get('/getmissionmember/:id', function(req, res) {
  async.waterfall([function(callback) {
    Mission.find({
      missionID : req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});


//20190617 미션 포기
router.get('/giveupmission/:id', function(req, res) {
  //var carezonelist = null;
  //console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.findOneAndRemove({
      email: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//미션 참여중인지 체크 하는 내용
router.get('/chkmission/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.findOne({
      email: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

router.get('/missioncount/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.count({
      missionID: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

router.get('/list', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find( {exposure: {$lte : new Date()}}, function(err, docs) {
      res.json(docs);
    }).sort({"startmission" : 1 });
  }]);
});

router.get('/main_list', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find( {exposure: {$lte : new Date()}}, function(err, docs) {
      res.json(docs);
    }).sort({"startmission" : 1 }).limit(3);
  }]);
});

router.get('/mission/:id', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.findOne({
      _id: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});



router.get('/', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10;
  var search = createSearch(req.query);
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function(callback) {
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
  }, function(callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Carezone.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Carezone.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, carezone) {
      if (err) callback(err);
      callback(null, carezone, maxPage);
    });
  }], function(err, carezone, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("carezone/index", {
      carezone: carezone,
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





router.get('/new', isLoggedIn, function(req, res) {
  res.render("carezone/new", {
    user: req.user
  });
}); // new



router.post('/', upload.fields([{ name: 'image' }, { name: 'prodimage' }]), isLoggedIn, function(req, res, next) {
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      if (counter) {
        callback(null, counter);
      } else {
        CarezoneCounter.create({
          name: "carezone",
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
    var newPost = req.body.post;
    newPost.author = req.user._id;
    newPost.numId = counter.totalCount + 1;
    req.body.post.filename = req.files['image'][0].filename;
    req.body.post.originalName = req.files['image'][0].originalname;
    req.body.post.prodfilename = req.files['prodimage'][0].filename;
    req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
    Carezone.create(req.body.post, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      counter.totalCount++;
      counter.save();
      res.redirect('/carezone');
    });
  });
}); // create





router.get('/:id', function(req, res) {
  Carezone.findById(req.params.id)
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
      var url = req.protocol + '://' + req.get('host') + '/carezone_images/' + post._id;
      var prod_url = req.protocol + '://' + req.get('host') + '/carezone_prodimages/' + post._id;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("carezone/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // show






router.get('/:id/edit', isLoggedIn, function(req, res) {
  Carezone.findById(req.params.id, function(err, post) {
    var url = req.protocol + '://' + req.get('host') + '/images/' + post._id;

    var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;


    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    var preprodfilename  = post.prodfilename;
    var preprodoriginalname = post.prodoriginalname;
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!req.user._id.equals(post.author)) return res.json({
      success: false,
      message: "Unauthrized Attempt"
    });
    res.render("carezone/edit", {
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
}); // edit





router.put('/:id', upload.fields([{ name: 'image' }, { name: 'prodimage' }]), isLoggedIn, function(req, res, next) {
  //console.log("prefilename:"+ req.body.prefilename);
  //console.log("preoriginalName:" + req.body.preoriginalName);
  req.body.post.updatedAt = Date.now();
  req.body.post.filename = req.files['image'][0].filename;
  req.body.post.originalName = req.files['image'][0].originalname;
  req.body.post.prodfilename = req.files['prodimage'][0].filename;
  req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
  del([path.join(__dirname, '../uploads/', req.body.prefilename)]).then(deleted => {
    //res.sendStatus(200);
  });

  del([path.join(__dirname, '../uploads/', req.body.preprodfilename)]).then(deleted => {
    //res.sendStatus(200);
  });
  Carezone.findOneAndUpdate({
    _id: req.params.id,
    author: req.user._id
  }, req.body.post, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!post) return res.json({
      success: false,
      message: "No data found to update"
    });
    res.redirect('/carezone/' + req.params.id);
  });
}); //update



router.delete('/:id', isLoggedIn, function(req, res, next) {
  Carezone.findOneAndRemove({
    _id: req.params.id,
    author: req.user._id
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    del([path.join(__dirname, '../uploads/', post.filename)]).then(deleted => {
      //res.sendStatus(200);
    });

    del([path.join(__dirname, '../uploads/', post.prodfilename)]).then(deleted => {
      //res.sendStatus(200);
    });
    if (!post) return res.json({
      success: false,
      message: "No data found to delete"
    });
    res.redirect('/carezone');
  });
}); //destroy



router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  Carezone.update({
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
    res.redirect('/carezone/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  Carezone.update({
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
      res.redirect('/carezone/' + req.params.postId + "?" +
        req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
    });
}); //destroy a comment






function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect('/');
}

module.exports = router;

function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 2) { //검색어 글자수 제한 하는 것
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
