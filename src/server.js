const express = require('express');


var passport = require('passport');
var mongoose = require('mongoose');
const MongoClient = require("mongodb").MongoClient;
var config = require('./config/config');
var cors = require('cors');
var port = process.env.PORT || 8001;
var NaverStrategy = require('passport-naver').Strategy;
var KakaoStrategy = require('passport-kakao').Strategy;
var ejs = require('ejs');
var User = require('./models/user');
var Image = require('./models/image');
var UserImage = require('./models/UserImage');
var Banner = require('./models/Banner');
var Carezone = require('./models/Carezone');
var Beauty = require('./models/Beauty');
var CommuBeauty = require('./models/CommuBeauty');
var BeautyNote = require('./models/BeautyNote');
var SkinQna = require('./models/SkinQna');
var SkinChart = require('./models/SkinChart');
var Notice = require('./models/Notice');
var Tags = require('./models/Tags');
const GoogleStrategy = require('passport-google-oauth20');
var jwt = require('jsonwebtoken');
var config = require('./config/config');
var userController = require('./controller/user-controller');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var del = require('del');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');


let UPLOAD_PATH = "./uploads/"
//let PORT = 3000;

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

module.exports = function(app) {
  var app = express();
  app.use(cors());

  // get our request parameters
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(methodOverride("_method"));
  app.use(flash());
  app.use(session({
    secret: 'MySecret'
  }));
  app.use(countVisitors);

  // Use the passport package in our application


  // app.use(passport.initialize());


  //관리자용
  var passport = require('./config/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  var passportMiddleware = require('./middleware/passport');
  passport.use(passportMiddleware);


  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  //해쉬태그 모두 가져 오기
  app.get('/gethashtags', function(req, res) {
    Tags.find(function(err, docs) {
      if (err) { res.sendStatus(400);}
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      res.json(docs);
    });
  });



  //업로드 이미지 모듈 개발
  //이미지 업로드
  app.post('/images', upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newImage = new Image();
    newImage.filename = req.file.filename;
    newImage.originalName = req.file.originalname;
    newImage.desc = req.body.desc
    newImage.save(err => {
      if (err) {
        return res.sendStatus(402);
      }
      res.status(201).send({
        newImage
      });
    });
  });

  //뷰티 노트 이미지 업로드
  app.post('/beautynoteimages', upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new BeautyNote();
    newUser.filename = req.file.filename;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.desc
    newUser.save(err => {
      if (err) {
        console.log("Image Error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  //사용자 이미지 업로드
  app.post('/userimages', upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new UserImage();
    newUser.filename = req.file.filename;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.desc
    newUser.save(err => {
      if (err) {
        console.log("Image Error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  //사용자 이미지 수정
  app.post('/userupdateimages', upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new UserImage();
    newUser.isNew = false;
    newUser.filename = req.file.filename;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.email;
    newUser._id = req.body.id;
    newUser.save(err => {
      if (err) {
        console.log("error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  // Get all uploaded images
  app.get('/userimages', (req, res, next) => {
    // use lean() to get a plain JS object
    // remove the version key from the response
    UserImage.find({}, '-__v').lean().exec((err, images) => {
      if (err) {
        res.sendStatus(400);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = req.protocol + '://' + req.get('host') + '/images/' + img._id;
      }
      res.json(images);
    })
  });


  // Get one image by its ID
  app.get('/userimages/:id', (req, res, next) => {

    UserImage.findOne({
      email: req.params.id
    }, function(err, image) {
      if (err) {
        res.sendStatus(400);
      }
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      //res.json(docs);
    });

    // let imgId = req.params.id;
    // UserImage.findone(imgId, (err, image) => {
    //   if (err) {
    //     res.sendStatus(400);
    //   }
    //   // stream the image back by loading the file
    // res.setHeader('Content-Type', 'image/jpeg');
    // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    // })
  });


  app.get('/userupdateimages/:id', (req, res, next) => {

    UserImage.findOne({
      email: req.params.id
    }, function(err, image) {
      if (err) {
        res.sendStatus(400);
      }
      res.json(image);
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      //res.json(docs);
    });

    // let imgId = req.params.id;
    // UserImage.findone(imgId, (err, image) => {
    //   if (err) {
    //     res.sendStatus(400);
    //   }
    //   // stream the image back by loading the file
    // res.setHeader('Content-Type', 'image/jpeg');
    // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    // })
  });



  // Get all uploaded images
  app.get('/images', (req, res, next) => {
    // use lean() to get a plain JS object
    // remove the version key from the response
    Image.find({}, '-__v').lean().exec((err, images) => {
      if (err) {
        res.sendStatus(400);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = req.protocol + '://' + req.get('host') + '/images/' + img._id;
      }
      res.json(images);
    })
  });


  // Get one image by its ID
  app.get('/images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Banner.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });


  app.get('/prod_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });

  app.get('/beauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/commubeauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    CommuBeauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');

      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/beautynote_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    BeautyNote.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');

      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/skinqna_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    SkinQna.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');

      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/carezone_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });



  app.get('/notice_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Notice.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/notice_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Notice.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });

  // Get one image by its ID
  // app.get('/carezone_images/:id', (req, res, next) => {
  //   let imgId = req.params.id;
  //
  //   Carezone.findById(imgId, (err, image) => {
  //     if (err) {
  //       res.sendStatus(400);
  //     }
  //     // stream the image back by loading the file
  //     res.setHeader('Content-Type', 'image/jpeg');
  //     fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
  //   })
  // });

  app.get('/carezone_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });

  // Get one image by its ID
  app.get('/beauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/beauty_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });


  // Delete one image by its ID
  app.delete('/images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Image.findByIdAndRemove(imgId, (err, image) => {
      if (err && image) {
        res.sendStatus(400);
      }

      del([path.join(__dirname, '../uploads/', image.filename)]).then(deleted => {
        res.sendStatus(200);
      })
    })
  });

  app.get('/userskinscore/:id', (req, res, next) => {

    SkinChart.findOne({
      email: req.params.id
    }, function(err, score) {
      if (err) { res.sendStatus(400);}
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      res.json(score);
    });
  });

  app.get('/userskinchart/:id/:month', (req, res, next) => {
    console.log(req.params.id);
    console.log(req.params.month);

    var start = new Date('2019-07-02');
    var end = new Date('2019-07-05');
    // var month = new Date(req.params.month);
    // console.log(month)
    SkinChart.find(
      {email: req.params.id},
      // {saveDate : { $gte: '2019-07', $lte: '20' }},
      {score : {$elemMatch : { saveDate : { $gte: new Date('2019-07-10T00:00:00.000+00:00')} } } },
      // { students: { $elemMatch: { school: 102, age: { $gt: 10} } } } )
      // {'score.saveDate' : { $lte: new Date('2019-07-01') } },
     function(err, score) {
      if (err) { console.log(err),res.sendStatus(400);}
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      res.json(score);
    });
  });

  app.get('/beautynoteimage/:id', (req, res, next) => {
    let imgId = req.params.id;

    BeautyNote.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/skinqnaimage/:id', (req, res, next) => {
    let imgId = req.params.id;

    SkinQna.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(400);
      }
      // stream the image back by loading the file
      if(image.finename){
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      } else {
        res.sendStatus(201);
      }
    })
  });


  // Demo Route (GET http://localhost:8001)
  app.get('/', function(req, res) {
    return res.send('Hello! The API is at http://localhost:' + port + '/api');
  });



  var routes = require('./routes');
  app.use('/api', routes);

  app.set('view engine', 'ejs');
  app.set('views', './src/views')
  //cafe24전용 ejs 경로 하드코딩으로 사용해야 성공했음
  //app.set('views', '/home/hosting_users/g1partners4/apps/g1partners4_plinic/src/views')


  //플리닉 관리자 페이지 라우터 개발 20190430 추호선
  app.use('/home', require('./home'));
  app.use('/users', require('./users'));
  app.use('/posts', require('./posts'));
  app.use('/menus', require('./menus'));
  app.use('/banner', require('./banner'));
  app.use('/carezone', require('./carezone'));
  app.use('/beauty', require('./beauty'));
  app.use('/notice', require('./notice'));
  app.use('/qna', require('./qna'));
  app.use('/commubeauty', require('./commubeauty'));
  app.use('/beautynote', require('./beautynote'));
  app.use('/skinqna', require('./skinqna'));

  app.get('/ejs', (req, res) => {
    res.render('home');
  })

  app.get('/google', passport.authenticate('google', {
    scope: ['profile']
  }));

  function createToken(user) {
    return jwt.sign({
      id: user.id,
      email: user.email
    }, config.jwtSecret, {
      expiresIn: 86400 // 86400 expires in 24 hours
      //expiresIn: 200 // 86400 expires in 24 hours
    });
  }

  passport.use(new KakaoStrategy({
      clientID: '3fad3ed55ef1830fd6d1c10faf0d9072',
      clientSecret: '13NCCqRqTNBCcrN8vVNuyupWrH3kv6qM', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
      callbackURL: '/auth/login/kakao/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'kakao.id': profile.id
      }, function(err, user) {
        if (!user) {
          user = new User({
            name: profile.nickname,
            email: profile.id,
            username: profile.nickname,
            provider: 'kakao',
            naver: profile._json
          });
          user.save(function(err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));

  app.get('/auth/kakao', passport.authenticate('kakao', {
    failureRedirect: '#!/login'
  }));

  app.get('/api/auth/login/kakao/callback', passport.authenticate('kakao', {
    successRedirect: '/api',
    failureRedirect: '#!/login'
  }));


  passport.use(new NaverStrategy({
      clientID: 'cIUVxjnNe7iTuqbTQZvu',
      clientSecret: 'joXW3wHq8s',
      callbackURL: '/auth/login/naver/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'naver.id': profile.id
      }, function(err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.displayName,
            provider: 'naver',
            naver: profile._json
          });
          user.save(function(err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));

  app.route('/auth/naver')
    .get(passport.authenticate('naver', {
      failureRedirect: '#!/auth/login'
    }));


  app.route('/auth/login/naver/callback')
    .get(passport.authenticate('naver', {
      successRedirect: '/api',
      failureRedirect: '#!/auth/login'
    }));



  passport.use(new GoogleStrategy({
      callbackURL: '/auth/google/callback',
      clientID: '182510992437-ri45f5fdo8be7h193uvfohcugf9jh5fl.apps.googleusercontent.com',
      clientSecret: 'RsAmattHXCaNXID1JlnluzJi'
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'google.id': profile.id
      }, function(err, user) {
        if (!user) {
          user = new User({
            googleId: profile.googleId,
            username: profile.displayName,
            provider: 'google',
            naver: profile._json
          });
          user.save(function(err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));


  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
  }));


  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/api',
    failureRedirect: '#!/login'
  }));

  /*
  const uri = "mongodb+srv://plinic:1234@cluster0-hgfgd.mongodb.net/plinic?retryWrites=true";
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(err => {
    console.log("1");
    const collection = client.db("plinic").collection("devices");
    // perform actions on the collection object
    console.log(err);
    client.close();
  });
  */

  mongoose.connect(config.db, {
    useNewUrlParser: true,
    useCreateIndex: true
  });

  const connection = mongoose.connection;

  connection.once('open', () => {
    console.log('MongoDB database connection established successfully!');
  });

  connection.on('error', (err) => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    process.exit();
  });


  // Start the server
  app.listen(port);
  console.log('Plinic Server : http://localhost:' + port);
  return app;


  function countVisitors(req, res, next) {
    if (!req.cookies.count && req.cookies['connect.sid']) {
      res.cookie('count', "", {
        maxAge: 3600000,
        httpOnly: true
      });
      var now = new Date();
      var date = now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate();
      if (date != req.cookies.countDate) {
        res.cookie('countDate', date, {
          maxAge: 86400000,
          httpOnly: true
        });

        var Counter = require('./models/Counter');
        Counter.findOne({
          name: "vistors"
        }, function(err, counter) {
          if (err) return next();
          if (counter === null) {
            Counter.create({
              name: "vistors",
              totalCount: 1,
              todayCount: 1,
              date: date
            });
          } else {
            counter.totalCount++;
            if (counter.date == date) {
              counter.todayCount++;
            } else {
              counter.todayCount = 1;
              counter.date = date;
            }
            counter.save();
          }
        });
      }
    }
    return next();
  }
}
