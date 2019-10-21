var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var BeautyNote = require('./models/BeautyNote');
var Tags = require('./models/Tags');
var BeautyNoteCounter = require('./models/BeautyNoteCounter');
var async = require('async');
var User_admin = require('./models/User_admin');
var multer = require('multer');
// var FTPStorage = require('multer-ftp');
var sftpStorage = require('multer-sftp');
let Client = require('ssh2-sftp-client');
var path = require('path');
var fs = require('fs');
var del = require('del');
var multerS3 = require('multer-s3');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");

let s3 = new AWS.S3();

let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'plinic',
    metadata: function(req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + '-' + Date.now()
      });
    },
    key: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    },
    acl: 'public-read'
  })
});




//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
// var storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, path.join(__dirname, '../uploads/'));
//     //cb(null, UPLOAD_PATH)
//   },
//   filename: function(req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })

// let upload = multer({
//   storage: storage
// });

// var sftpUpload = multer({
//   storage: new sftpStorage({
//     sftp: {
//       host: 'g1partners1.cafe24.com',
//       // secure: true, // enables FTPS/FTP with TLS
//       port: 3822,
//       user: 'g1partners1',
//       password: 'g100210!!',
//     },
//     // basepath: '/www/plinic',
//     destination: function(req, file, cb) {
//       cb(null, '/www/plinic')
//     },
//     filename: function(req, file, cb) {
//       cb(null, file.fieldname + '-' + Date.now())
//     }
//   })
// });

// const sftpconfig = {
//   host: 'g1partners1.cafe24.com',
//   port: 3822,
//   user: 'g1partners1',
//   password: 'g100210!!'
// };

router.get('/delete/:id', function(req, res, next) {
  BeautyNote.findOneAndRemove({
    _id: req.params.id,
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    var params = {
      Bucket: 'plinic',
      Key: post.filename
    };
    s3.deleteObject(params, function(err, data) {
      if (err) {
        console.log("피부고민 파일 삭제 에러 : " + post.filename + "err : " + err);
        res.status(500);
      } else console.log("피부고민 파일 삭제 완료 : ");
    });
    // res.sendStatus(200);
    res.status(201).json(post);
  });
}); //destroy


router.get('/like/:id/:email', function(req, res) {
  BeautyNote.findById(req.params.id)
    .exec(function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      var k = 0;
      for (let i = 0; i < post.likeuser.length; i++) {
        if (post.likeuser[i] == req.params.email) {
          k++;
        }
      }
      if (k == 0) {
        post.like++;
        post.save();
        BeautyNote.update({
          _id: req.params.id
        }, {
          $push: {
            likeuser: req.params.email
          }
        }, function(err, post2) {
          if (err) {
            console.log("tags error : " + err);
          } else {
            // console.log("result tags : " + JSON.stringify(post2));
            // res.status(201).json(post2);
            res.json(post2);
          }
        })
      }
      // res.status(200).json(user);
    });
}); // like

router.get('/dislike/:id/:email', function(req, res) {
  BeautyNote.findById(req.params.id)
    .exec(function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.like--;
      post.save();
      BeautyNote.update({
        _id: req.params.id
      }, {
        $pull: {
          likeuser: req.params.email
        }
      }, function(err, post2) {
        if (err) {
          // console.log("tags error : " + err);
        } else {
          // console.log("result tags : " + JSON.stringify(post2));
          res.status(201).json(post2);
        }
      })
      // res.sendStatus(200);
    });
}); // dislike



router.get('/list', function(req, res) {
  async.waterfall([function(callback) {
    BeautyNote.find(function(err, docs) {
      res.json(docs);
    });


  }]);
});

router.get('/editorlist', function(req, res) {
  async.waterfall([function(callback) {
    BeautyNote.find({
      editor: true
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "editorUpdateAt": -1
    }).limit(2);
  }]);
});

router.get('/main_list', function(req, res) {
  async.waterfall([function(callback) {
    BeautyNote.find(function(err, docs) {
      res.json(docs);
    }).sort({
      "_id": -1
    });
  }]);
});

router.get('/main_list', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    BeautyNote.find(function(err, docs) {
      res.json(docs);
    }).sort({
      "_id": -1
    }).limit(3);
  }]);
});

router.get('/list/:id', function(req, res) {
  async.waterfall([function(callback) {
    BeautyNote.findOne({
      _id: req.params.id
    }, function(err, docs) {
      docs.views++;
      docs.save();
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
    BeautyNoteCounter.findOne({
      name: "beautynote"
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
    BeautyNote.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    BeautyNote.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, beautynote) {
      if (err) callback(err);
      callback(null, beautynote, maxPage);
    });
  }], function(err, beautynote, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("beautynote/index", {
      beautynote: beautynote,
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
  res.render("beautynote/new", {
    user: req.user
  });
}); // new



router.post('/', s3upload.fields([{
  name: 'image'
}]), function(req, res, next) {
  async.waterfall([function(callback) {
    BeautyNoteCounter.findOne({
      name: "beautynote"
    }, function(err, counter) {
      if (err) callback(err);
      if (counter) {
        callback(null, counter);
      } else {
        BeautyNoteCounter.create({
          name: "beautynote",
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
    // let newNote = BeautyNote(req.body.desc);
    let newNote = BeautyNote();
    newNote.email = req.body.email;
    newNote.select = req.body.select;
    newNote.title = req.body.title;
    newNote.contents = req.body.contents;
    newNote.pushtoken = req.body.pushtoken;
    newNote.tags = JSON.stringify(req.body.tags).replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
    newNote.numId = counter.totalCount + 1;
    newNote.filename = req.files['image'][0].key;
    newNote.originalName = req.files['image'][0].originalname;
    newNote.save((err, user) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          'msg': '뷰티노트가 등록되지 않았습니다. <br /> Error : ' + err
        });
      }
      var newTags = req.body.tags.replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
      Tags.update({
        _id: '5d2c39cc9cc12aae489d2f08'
      }, {
        $push: {
          tags: newTags
        }
      }, function(err, post2) {
        if (err) {
          console.log("tags error : " + err);
        } else {
          // console.log("result tags : " + JSON.stringify(post2));
        }
      })
      return res.status(201).json(user);
    });
  });
}); // create


router.post('/noteUpdate/:id', s3upload.fields([{
  name: 'image'
}]), function(req, res, next) {

  req.body.tags = JSON.stringify(req.body.tags).replace(/\"/g, "").replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, "");
  req.body.filename = req.files['image'][0].key;
  req.body.originalName = req.files['image'][0].originalname;
  async.waterfall([function(callback) {
    BeautyNote.findOneAndUpdate({
      _id: req.params.id,
    }, req.body, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      if (!post) return res.json({
        success: false,
        message: "No data found to update"
      });
      // res.redirect('/beautynote/' + req.params.id);
      return res.status(201).json(post);
    });
  }], function(callback, result) {
    // let newNote = BeautyNote(req.body.desc);
  });
}); //update





router.get('/:id', function(req, res) {
  BeautyNote.findById(req.params.id)
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
      // var url = req.protocol + '://' + req.get('host') + '/beautynoteimage/' + post._id;
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      // var url = req.protocol + '://' + 'plinic.cafe24app.com' + '/beautynoteimage/' + post._id;
      // var prod_url = req.protocol + '://' + req.get('host') + '/beautynote_prodimages/' + post._id;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("beautynote/show", {
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
  console.log("edit")
  console.log(req.params.id);
  BeautyNote.findById(req.params.id, function(err, post) {
    var url = req.protocol + '://' + req.get('host') + '/beautynoteimage/' + post._id;
    // var url = req.protocol + '://' + 'plinic.cafe24app.com' + '/beautynoteimage/' + post._id;
    console.log(url)
    // var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;


    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    // var preprodfilename  = post.prodfilename;
    // var preprodoriginalname = post.prodoriginalname;
    if (err) return res.json({
      success: false,
      message: err
    });
    // if (!req.user._id.equals(post.author)) return res.json({
    //   success: false,
    //   message: "Unauthrized Attempt"
    // });
    res.render("beautynote/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      // preprodfilename: preprodfilename,
      // preprodoriginalname: preprodoriginalname,
      url: url,
      //prod_url: prod_url,
      user: req.user
    });
  });
}); // edit





router.put('/:id', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), function(req, res, next) {
  //console.log("prefilename:"+ req.body.prefilename);
  //console.log("preoriginalName:" + req.body.preoriginalName);
  console.log(req.body.post.editor);
  if (!req.body.post.editor) {
    req.body.post.editor = false;
    req.body.post.updatedAt = Date.now();
  }
  if (req.body.post.editor) {
    req.body.post.editor = true;
    req.body.post.updatedAt = Date.now();
  }
  // req.body.post.filename = req.files['image'][0].filename;
  // req.body.post.originalName = req.files['image'][0].originalname;
  //req.body.post.prodfilename = req.files['prodimage'][0].filename;
  //req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
  // del([path.join(__dirname, '../uploads/', req.body.prefilename)]).then(deleted => {
  //res.sendStatus(200);
  // });

  // del([path.join(__dirname, '../uploads/', req.body.preprodfilename)]).then(deleted => {
  //   //res.sendStatus(200);
  // });
  BeautyNote.findOneAndUpdate({
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
    res.redirect('/beautynote/' + req.params.id);
  });
}); //update



router.delete('/:id', isLoggedIn, function(req, res, next) {
  BeautyNote.findOneAndRemove({
    _id: req.params.id,
    author: req.user._id
  }, function(err, post) {
    var s3parmas = {
      Bucket: 'plinic',
      Key: post.filename,
    };
    s3.deleteObject(s3parmas, function(err, data){
      if(err) {
        console.log("뷰티노트 파일 삭제 에러 : " + post.filename + "err : " + err);
        res.status(500);
      }
      else console.log("뷰티노트 파일 삭제 완료 : " + post.filename);
    });
    if (err) return res.json({
      success: false,
      message: err
    });
    // del([path.join(__dirname, '../uploads/', post.filename)]).then(deleted => {
    //   //res.sendStatus(200);
    // });

    // del([path.join(__dirname, '../uploads/', post.prodfilename)]).then(deleted => {
    //   //res.sendStatus(200);
    // });
    if (!post) return res.json({
      success: false,
      message: "No data found to delete"
    });
    res.redirect('/beautynote');
  });
}); //destroy



router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  BeautyNote.update({
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
    res.redirect('/beautynote/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  BeautyNote.update({
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
      res.redirect('/beautynote/' + req.params.postId + "?" +
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
