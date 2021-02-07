
const passport = require('passport');
const cloudinary = require('cloudinary')
const flash = require('express-flash')
const session = require('express-session')
const cors = require('cors');
const formData = require('express-form-data')
require('dotenv').config()
  //this loads all the environment variables and sets them inside of process.env
const express = require('express');
// const db = require('./db/database.js')
const {User, Favorites, Markers, Comments} = require('./db/database.js')
const app = express();
app.set('view engine', 'ejs')
const path = require('path');
const axios = require('axios');
const bodyParser= require('body-parser');
//changed extended to false to work with form data;allows data to be in req body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..','client','dist')))
app.use(bodyParser.json())
require('../passport.config');
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'google-auth-session',
  keys: ['key1', 'key2']
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(cors())
app.use(flash())
app.use(formData.parse())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,//should we resave if nothing changes
  saveUninitialized: false // do we want to save empty value
}))

cloudinary.config({
cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

app.get('/markers', (req, res) => {

  Markers.findAll({})
    .then((data) => {
      res.send(data);
    })
    .catch((err) =>{
      console.log(err);
    });
});
app.post('/markers', (req, res) => {


    req.body.map((marker) => {
      const {latitude,
        longitude,
        description} = marker;


        const newMarker = new Markers({
          latitude,
          longitude,
          description
        });

        newMarker.save()
          .then((data) => {
            console.log('MARKERS ADDED');

          })
          .catch((err) => {

          });
    })
  });

  app.post('/comments', (req, res) => {
    console.log(req.body)
    const{comments, description} = req.body
        const newComment = new Comments({
          comments,
          description
        });
        newComment.save()
          .then((data) => {
            console.log('COMMENTS ADDED');
            res.redirect('/');
          })
          .catch((err) => {
             console.log(err)
          });
  });


  app.post('/create', (req, res) => {
    const values = Object.values(req.files)
    const promises = values.map(image => cloudinary.uploader.upload(image.path))
    const {latitude,
      longitude,
      description} = req.body;
      Promise
      .all(promises)
      .then(res =>  {
        console.log(res)
        const newMarker = new Markers({
          latitude,
          imageUrl: res[0].url,
          longitude,
          description
        })
        newMarker.save()
        .then((data) => {
          console.log('MARKERS ADDED');
        })
        .catch((err) => {
          console.log('this is the err we are looking for', err)
        });
    })
    .catch(err => console.error('Error creating marker', err))
})

app.post('/register', (req, res) => {

  const {username, email, password} = req.body;
  //const password = await bcrypt.hash(req.body.password, 10)

  const newUser = new User({
    username,
    password,
    email
  })
  newUser.save()
    .then((data) => {
      console.log('THIS IS DATA:', data);
      res.redirect('/')

    })
    .catch((err) => {
      console.log(err);
    });
});

app.post('/api/favorites', (req, res) => {
  //console.log('APP POST REQ', req.body);
  const {latitude, longitude, description, imageUrl} = req.body;

  const newFavorite = new Favorites({
    latitude,
    longitude,
    imageUrl,
    description
  })
  newFavorite.save()
    .then((data) => {
      console.log('THIS IS DATA:', data);
      res.redirect('/')

    })
    .catch((err) => {
      console.log(err);
    });
});


app.get('/comments', (req, res) => {

  console.log('comment req.body', req.body)
  return Comments.findAll({})
      .then((data) => { res.send(data)})
      .catch((err) => {console.log(err)
      })

      //  bcrypt.compare(password, data.password)
      // .then((correct) => console.log('login successful'))
      // .catch((err) => console.log('WRONG PASSWORD', err))

});

//logout route
app.get('/logout', (req, res) => {
  req.session = null;
  req.logout()
  res.redirect('/')
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/error', (req, res) => res.send('Unknown Error'))
app.get('/api/account/google', passport.authenticate('google', { failureRedirect: '/auth/error' }),
  function(req, res) {
    res.redirect('/');
  }
);
app.get('/', (req, res) => res.send(`Welcome ${req.user.displayName}!`))


app.listen(3000, function() {
  console.log('listening on 3000')
})
