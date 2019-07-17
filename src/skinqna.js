var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var SkinQna = require('./models/SkinQna');
var Tags = require('./models/Tags');
var SkinQnaCounter = require('./models/SkinQnaCounter');
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


router.get('/list/:id', function(req, res) {
  async.waterfall([function(callback) {
    SkinQna.findOne({ _id : req.params.id },function(err, docs) {
      res.json(docs);
    });
  }]);
});

router.get('/qna/:id', function(req, res) {
  async.waterfall([function(callback) {
    SkinQna.find({ _id : req.params.id },function(err, docs) {
      res.json(docs);
    });
  }]);
});

router.get('/editorlist', function(req, res) {
  async.waterfall([function(callback) {
    SkinQna.find({ editor: true },function(err, docs) {
      res.json(docs);
    }).sort({"editorUpdateAt" : -1 }).limit(2);
  }]);
});

router.get('/main_list', function(req, res) {
  async.waterfall([function(callback) {
    SkinQna.find(function(err, docs) {
      res.json(docs);
    }).sort({"_id" : -1 });
  }]);
});

router.get('/mission/:id', function(req, res) {
  async.waterfall([function(callback) {
    SkinQna.findOne({
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
    SkinQnaCounter.findOne({
      name: "skinqna"
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
    SkinQna.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    SkinQna.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, skinqna) {
      if (err) callback(err);
      callback(null, skinqna, maxPage);
    });
  }], function(err, skinqna, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("skinqna/index", {
      skinqna: skinqna,
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
  res.render("skinqna/new", {
    user: req.user
  });
}); // new



router.post('/', upload.fields([{ name: 'image' }]), function(req, res, next) {
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
    newNote.tags = JSON.stringify(req.body.tags).replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
    newNote.numId = counter.totalCount + 1;
    newNote.filename = req.files['image'][0].filename;
    newNote.originalName = req.files['image'][0].originalname;
    newNote.save((err, user) => {
        if (err) {
          console.log(err);
            return res.status(400).json({ 'msg': '뷰티노트가 등록되지 않았습니다. <br /> Error : ' + err });
        }
        var newTags = req.body.tags.replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
        Tags.update({_id : '5d2c39cc9cc12aae489d2f08'},
          { $push: { tags: newTags }
        }, function(err, post2) {
          if (err) {
            console.log("tags error : " + err);
          } else {
            console.log("result tags : " + JSON.stringify(post2));
          }
        })
        return res.status(201).json(user);
    });
  });
}); // create





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
      var url = req.protocol + '://' + req.get('host') + '/skinqnaimage/' + post._id;
      // var url = req.protocol + '://' + 'plinic.cafe24app.com' + '/skinqnaimage/' + post._id;
      // var prod_url = req.protocol + '://' + req.get('host') + '/skinqna_prodimages/' + post._id;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("skinqna/show", {
        post: post,
        url: url,
        // prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // show






router.get('/:id/edit', isLoggedIn, function(req, res) {
  SkinQna.findById(req.params.id, function(err, post) {
    var url = req.protocol + '://' + req.get('host') + '/skinqnaimage/' + post._id;
    // var url = req.protocol + '://' + 'plinic.cafe24app.com' + '/skinqnaimage/' + post._id;




    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    var preprodfilename  = post.prodfilename;
    var preprodoriginalname = post.prodoriginalname;
    if (err) return res.json({
      success: false,
      message: err
    });

    res.render("skinqna/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      preprodfilename: preprodfilename,
      preprodoriginalname: preprodoriginalname,
      url: url,
      user: req.user
    });
  });
}); // edit





router.put('/:id', upload.fields([{ name: 'image' }, { name: 'prodimage' }]), isLoggedIn, function(req, res, next) {
  //console.log("prefilename:"+ req.body.prefilename);
  //console.log("preoriginalName:" + req.body.preoriginalName);
  if(!req.body.post.editor){
    req.body.post.editor = false;
    req.body.post.updatedAt=Date.now();
  }
  if(req.body.post.editor){
    req.body.post.editor = true;
    req.body.post.updatedAt=Date.now();
  }
  req.body.post.updatedAt = Date.now();

  SkinQna.findOneAndUpdate({
    _id: req.params.id,
  }, req.body.post, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!post) return res.json({
      success: false,
      message: "No data found to update"
    });
    res.redirect('/skinqna/' + req.params.id);
  });
}); //update



router.delete('/:id', isLoggedIn, function(req, res, next) {
  SkinQna.findOneAndRemove({
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
    res.redirect('/skinqna');
  });
}); //destroy



router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  SkinQna.update({
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
    res.redirect('/skinqna/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  SkinQna.update({
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
      res.redirect('/skinqna/' + req.params.postId + "?" +
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
