var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Qna = require('./models/Qna');
var QnaCounter = require('./models/QnaCounter');
var async = require('async');
var User_admin = require('./models/User_admin');
var multer = require('multer');
// var FTPStorage = require('multer-ftp');
var sftpStorage = require('multer-sftp');
let Client = require('ssh2-sftp-client');
var path = require('path');
var fs = require('fs');
var del = require('del');
var http = require('http');
var FCM = require('fcm-node');
var serverKey = 'AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU';
var fcm = new FCM(serverKey);

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
});

var sftpUpload = multer({
  storage: new sftpStorage({
    sftp: {
      host: 'g1partners1.cafe24.com',
      // secure: true, // enables FTPS/FTP with TLS
      port: 3822,
      user: 'g1partners1',
      password: 'g100210!!',
    },
    // basepath: '/www/plinic',
    destination: function(req, file, cb) {
      cb(null, '/www/plinic')
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
});

const sftpconfig = {
  host: 'g1partners1.cafe24.com',
  port: 3822,
  user: 'g1partners1',
  password: 'g100210!!'
};


router.get('/list/:email', function(req, res) {
  async.waterfall([function(callback) {
    Qna.find({
      email: req.params.email
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "_id": -1
    });
  }]);
});

router.get('/qna/:id', function(req, res) {
  async.waterfall([function(callback) {
    Qna.find({
      _id: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

router.get('/main_list', function(req, res) {
  async.waterfall([function(callback) {
    Qna.find(function(err, docs) {
      res.json(docs);
    }).sort({
      "_id": -1
    }).limit(3);
  }]);
});

router.get('/mission/:id', function(req, res) {
  async.waterfall([function(callback) {
    Qna.findOne({
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
    QnaCounter.findOne({
      name: "qna"
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
    Qna.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Qna.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, qna) {
      if (err) callback(err);
      callback(null, qna, maxPage);
    });
  }], function(err, qna, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("qna/index", {
      qna: qna,
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
  res.render("qna/new", {
    user: req.user
  });
}); // new



router.post('/', upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), isLoggedIn, function(req, res, next) {
  async.waterfall([function(callback) {
    QnaCounter.findOne({
      name: "qna"
    }, function(err, counter) {
      if (err) callback(err);
      if (counter) {
        callback(null, counter);
      } else {
        QnaCounter.create({
          name: "qna",
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
    Qna.create(req.body.post, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      counter.totalCount++;
      counter.save();
      res.redirect('/qna');
    });
  });
}); // create





router.get('/:id', function(req, res) {
  Qna.findById(req.params.id)
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
      // var url = req.protocol + '://' + req.get('host') + '/qna/' + post._id;
      var url = 'https://g1plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      // var prod_url = req.protocol + '://' + req.get('host') + '/qna_prodimages/' + post._id;
      var prod_url = 'https://g1plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("qna/show", {
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
  Qna.findById(req.params.id, function(err, post) {
    var url = req.protocol + '://' + req.get('host') + '/images/' + post._id;

    var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;


    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    var preprodfilename = post.prodfilename;
    var preprodoriginalname = post.prodoriginalname;
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!req.user._id.equals(post.author)) return res.json({
      success: false,
      message: "Unauthrized Attempt"
    });
    res.render("qna/edit", {
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





router.put('/:id', upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), isLoggedIn, function(req, res, next) {
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
  Qna.findOneAndUpdate({
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
    res.redirect('/qna/' + req.params.id);
  });
}); //update



router.delete('/:id', isLoggedIn, function(req, res, next) {
  Qna.findOneAndRemove({
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
    res.redirect('/qna');
  });
}); //destroy



router.post('/:id/comments', function(req, res) {
  var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: req.body.pushtoken,
    // collapse_key: 'your_collapse_key',

    notification: {
      // "title": this.beautyNoteOneLoadData.title,
      // "body": this.registerReply.comment,
      // "subtitle" : '댓글알림 subtitle',
      // "badge": 1,
      title: '문의하신 글에 댓글이 작성되었습니다.',
      body: req.body.comment.body,
      sound: "default",
      click_action: "FCM_PLUGIN_ACTIVITY",
    },

    data: { //you can send only notification or only data(or include both)
      mode: "myqna",
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
  Qna.update({
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
    res.redirect('/qna/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  Qna.update({
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
      res.redirect('/qna/' + req.params.postId + "?" +
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
