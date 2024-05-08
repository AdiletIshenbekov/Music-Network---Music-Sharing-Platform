const express = require('express')
const path = require('path')
const fs = require('fs')
var hbs = require('hbs')
var routes = require('./routes/index')
var session = require('express-session')

const PORT = process.env.PORT || 3000

const app = express() //create express server

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: 'auto',
        maxAge: 3600000 
    },
}));

app.get('/', (req, res) => {
    res.render('login')
});

app.get('/register', routes.registerPage)
app.get('/login' , routes.loginPage)
app.get('/home' , routes.homePage)
app.get('/playlists' , routes.playlistsPage)
app.get('/selectPlaylist' , routes.selectPlaylist)
app.get('/logout' , routes.loginPage)
app.get('/viewAccounts' , routes.viewAccounts)
app.get('/showSongs' , routes.showSongs)

app.post('/register', routes.register)
app.post('/login' , routes.login)
app.post('/createPlaylist' , routes.createPlaylist)
app.post('/addSong' , routes.addSong)
app.post('logout' , routes.logout)
app.post('/deletePlaylist' , routes.deletePlaylist)

app.listen(PORT, function() {
  console.log(`Static Server listening on PORT 3000, CNTL-C to Quit`)
  console.log(`To Test`)
  console.log(`http://localhost:3000`)
})

//npm install express
//npm install sqlite3
//npm install handlebars hbs
//npm install express-session