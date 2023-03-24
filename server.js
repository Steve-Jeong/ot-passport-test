import express from 'express'
import session from 'express-session'
import flash from 'connect-flash'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { lowdb } from './lowdb.js'
import GoogleStrategy from 'passport-google-oauth20'
import 'dotenv/config.js'
import FacebookStrategy from 'passport-facebook'
import KakaoStrategy from 'passport-kakao'
import NaverStrategy from 'passport-naver'
import { nanoid } from 'nanoid/async'
import bcrypt from 'bcrypt'

const app = express()

const LoginProvider = { Local: 'Local', Google: 'Google', Facebook: 'FaceBook', Kakao: 'Kakao', Naver: 'Naver' }

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    // console.log('email : ', email)
    // console.log('password : ', password)
    const user = lowdb.data.users.find(user => user.email === email)

    if (user == null) {
      console.log('user does not exist');
      return done(null, false, { message: 'No user with that email' })
    }

    if (await bcrypt.compare(password, user.password)) {
      return done(null, user)
    } else {
      console.log('user password incorrect');
      return done(null, false, { message: 'Password incorrect' })
    }
  }
))


import googleCredentials from './config/google.js'
passport.use(new GoogleStrategy({
  clientID: googleCredentials.web.client_id,
  clientSecret: googleCredentials.web.client_secret,
  callbackURL: googleCredentials.web.redirect_uris[0]
},
  async function (accessToken, refreshToken, profile, done) {
    // console.log('google verify CB accessToken : ', accessToken);
    // console.log('google verify CB refreshToken : ', refreshToken);
    // console.log('google verify CB profile : ', profile);
    // console.log('google verify CB profile.email : ', profile.emails[0].value);
    const gottenUser = {
      id: await nanoid(),
      name: profile.displayName,
      email: profile.emails[0].value,
      password: await bcrypt.hash(await nanoid(5),10),
      provider: LoginProvider.Google
    }
    const existingUser = lowdb.data.users.find(user => user.email === gottenUser.email)
    if (existingUser === undefined) {
      lowdb.data.users.push(gottenUser)
      await lowdb.write()
    }
    done(null, existingUser)
  }
));


import facebookCredentials from './config/facebook.js'
facebookCredentials.profileFields = ['id', 'emails', 'name']
passport.use(new FacebookStrategy(facebookCredentials,
  async function verify(accessToken, refreshToken, profile, done) {
    // console.log('facebook verify CB profile : ', profile);
    // console.log('facebook verify CB profile.email : ', profile.emails[0].value);
    const gottenUser = {
      id: await nanoid(),
      name: profile.name.givenName + ' ' + profile.name.familyName,
      email: profile.emails[0].value,
      password: await bcrypt.hash(await nanoid(5),10),
      provider: LoginProvider.Facebook
    }
    const existingUser = lowdb.data.users.find(user => user.email === gottenUser.email)
    if (existingUser === undefined) {
      lowdb.data.users.push(gottenUser)
      await lowdb.write()
    }
    done(null, existingUser)
  }
));


import kakaoCredentials from './config/kakao.js'
passport.use(new KakaoStrategy.Strategy(kakaoCredentials,
  async (accessToken, refreshToken, profile, done) => {
    // 사용자의 정보는 profile에 들어있다.
    // console.log('kakao verify CB profile : ', profile);
    // console.log('kakao verify CB profile email : ', profile._json.kakao_account.email);
    const gottenUser = {
      id: await nanoid(),
      name: profile.displayName,
      email: profile._json.kakao_account.email,
      password: await bcrypt.hash(await nanoid(5),10),
      provider: LoginProvider.Kakao
    }
    const existingUser = lowdb.data.users.find(user => user.email === gottenUser.email)
    if (existingUser === undefined) {
      lowdb.data.users.push(gottenUser)
      await lowdb.write()
    }
    done(null, existingUser)
  }
))


import naverCredentials from './config/naver.js'
passport.use(new NaverStrategy(naverCredentials,
  async (accessToken, refreshToken, profile, done) => {
    // console.log('naver verify CB profile : ', profile);
    const gottenUser = {
      id: await nanoid(),
      name: profile.displayName,
      email: profile.emails[0].value,
      password: await bcrypt.hash(await nanoid(5),10),
      provider: LoginProvider.Naver
    }
    const existingUser = lowdb.data.users.find(user => user.email === gottenUser.email)
    if (existingUser === undefined) {
      lowdb.data.users.push(gottenUser)
      await lowdb.write()
    }
    done(null, existingUser)
  }
))



passport.serializeUser(function (user, done) {
  console.log('serializeUser user : ', user)
  done(null, user.email)
})

passport.deserializeUser(function (email, done) {
  console.log('deserializeUser email : ', email)
  const user = lowdb.data.users.find(user => user.email === email)
  console.log('deserializeUser user : ', user)
  done(null, user)
})

app
  .get('/', (req, res) => {
    res.render('home.ejs', { user: req.user })
  })
  .get('/login', checkNotLoggedIn, (req, res) => {
    console.log('get /login : req.user : ', req.user)
    console.log('/login req.session : ', req.session);
    const message = req.flash('error')[0]
    res.render('login.ejs', { message })
  })
  .post('/login', checkNotLoggedIn, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  .get('/mypage', checkLoggedIn, (req, res) => {
    res.render('myPage.ejs', { user: req.user })
  })
  .get('/logout', checkLoggedIn, (req, res) => {
    req.logout(function (err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  })
  .get('/register', checkNotLoggedIn, (req, res) => {
    res.render('register.ejs')
  })
  .post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = {
      id: await nanoid(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      provider:LoginProvider.Local
    }
    lowdb.data.users.push(user)
    await lowdb.write()
    res.redirect('/login')
  })
  .get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }))
  .get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/facebook',
    passport.authenticate('facebook', { scope: 'email' }))
  .get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/kakao',
    passport.authenticate('kakao'))
  .get('/auth/kakao/callback',
    passport.authenticate('kakao', { failureRedirect: '/auth/kakao' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/naver',
    passport.authenticate('naver'))
  .get('/auth/naver/callback',
    passport.authenticate('naver', { failureRedirect: '/auth/naver' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })

function checkLoggedIn(req, res, next) {
  if (req.user === undefined) return res.redirect('/login');
  return next()
}

function checkNotLoggedIn(req, res, next) {
  if (req.user === undefined) return next();
  return res.redirect('/');
}


const PORT = 3031
app.listen(PORT, console.log(`server is listening on port http://localhost:${PORT}`))

