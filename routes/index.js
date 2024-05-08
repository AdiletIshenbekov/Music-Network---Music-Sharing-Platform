var url = require('url')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('data/db')

exports.registerPage = function(req , res , next) {
    res.render('register' , {})
}

exports.register = function(req, res) {
    var username = req.body.username
    var email = req.body.email
    var password = req.body.password
        
    //Check if account exists already by comparing username or email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?' , [username , email] , function(err , row) {
        if(err) {
            console.log(err)
            res.render('register' , { error: "error" })
            return
        }
        if(row) {
            res.render('register' , { error: "Account already exists" })
            return
        }
    });

    //Add new registered user to the database
    db.run('INSERT INTO users(username , email , password) VALUES(? , ? , ?)' , [username , email , password], function(err) {
        if(err) {
            console.error(err)
            res.render('register', { error: "Error creating account. Please try again later." })
            return
        }
        res.redirect('/login')
    });
};

exports.loginPage = function(req  , res , next) {
    res.render('login' , {})
}

exports.login = function(req , res) {
    var username = req.body.usernameLogin
    var password = req.body.passwordLogin
    var loggedIn = false

    //Check if admin user
    db.get('SELECT * FROM admins WHERE(username = ? AND password = ?)' , [username , password] , function(err , row) {
        if(err) {
            console.log(err)
            res.render('register' , { error: "error" })
            return
        }
        if(row) {
            req.session.authorized = true
            req.session.username = username
            req.session.isAdmin = true
            console.log("ADMIN LOGGED IN")
            res.redirect('/home')
        } else {
            //If not admin, check for guest users
            db.get('SELECT * FROM users WHERE(username = ? AND password = ?)' , [username , password] , function(err , row) {
                if(err) {
                    console.log(err)
                    res.render('register' , { error: "error" })
                    return
                }
                if(row) {
                    req.session.authorized = true
                    req.session.username = username
                    req.session.isAdmin = false
                    console.log("USER LOGGED In")
                    res.redirect('/home')
                } else {
                    res.render('login' , { error: "Invalid username or password" })
                }
            });
        }
    });
};

exports.logout = function(req, res, next) {
	req.session.destroy(function(err) {
        if(err) {
            console.log(err)
        }
		else {
            res.clearCookie('connect.sid')
            res.redirect('/login')
        }
    });
}

exports.homePage = function(req , res , next) {
    if(!req.session.authorized) {
        res.redirect('/login')
        return
    }
    //console.log("ADMIN?? " + req.session.isAdmin)
    db.all('SELECT playlist_name , username FROM playlists' , [] , function(err , rows) {
        if(err) {
            console.error(err)
            res.render('home', { error: "Error retrieving playlists." })
            return
        }
        res.render('home' , { playlists : rows , isAdmin : req.session.isAdmin , username: req.session.username })
    });
}

exports.playlistsPage = function(req , res , next) {
    if(!req.session.authorized) {
        res.redirect('/login')
        return
    }

    //Display all playlists
    db.all('SELECT * FROM playlists WHERE username = ?', [req.session.username] , function(err , rows) {
        if(err) {
            console.error(err)
            res.render('playlists', { error: "Error retrieving playlists. Please try again later." })
            return
        }
        res.render('playlists' , { playlists: rows , isAdmin : req.session.isAdmin , username: req.session.username })
    });
}

exports.createPlaylist = function(req , res) {
    var playlistName = req.body.playlistName.trim()
    console.log("USERNAME " + req.session.username)

    if(!playlistName) {
        res.render('playlists', { error: "Playlist name cannot be empty" })
        return
    }

    //Add the playlist to playlist table
    db.run('INSERT INTO playlists(playlist_name , username) VALUES(? , ?)' , [playlistName , req.session.username] , function(err) {
        if(err) {
            console.log(err)
            res.render('playlists' , { error: "error" })
            return
        }
        console.log("Playlist added succesfully")
    });

    //Display all playlists
    db.all('SELECT * FROM playlists WHERE username = ? ', [req.session.username] , function(err , rows) {
        if(err) {
            console.error(err)
            res.render('playlists', { error: "Error retrieving playlists" })
            return
        }
        res.render('playlists' , { playlists: rows })
    });
}

exports.addSong = function(req , res) {
    var songTitle = req.body.songTitle
    var artistName = req.body.artistName
    var playlistName = req.body.selectedPlaylistName

    if(!songTitle || !artistName) {
        res.render('playlists', { error: "Song title or artist name cannot be empty" })
        return
    }

    //console.log("PLAYLIST NAME " + playlistName)

    //Insert new song into database
    db.run('INSERT INTO songs(song_name , artist_name , playlist_name) VALUES(? , ? , ?)', [songTitle , artistName , playlistName] , function(err) {
        if(err) {
            console.error(err)
            res.render('playlists', { error: "Error adding song. Please try again later." })
            return
        }
        res.redirect('/playlists')
    });
}

exports.selectPlaylist = function(req, res) {
    var selectedPlaylist = req.query.selectedPlaylistName 
    console.log("PLAYLIST SELECTED: " + selectedPlaylist)

    //Fetch songs for the selected playlist from the database
    db.all('SELECT * FROM songs WHERE playlist_name = ?' , [selectedPlaylist] , function(err, rows) {
        if (err) {
            console.error(err)
            res.status(500).send({ error: "Error retrieving songs. Please try again later." })
            return
        }
        res.send({ songs: rows }); 
    });
}

exports.deletePlaylist = function(req , res) {
    if(!req.session.isAdmin) 
        return
    
    //console.log('Delete playlist request received')
    var playlistName = decodeURIComponent(req.body.playlistName)

    db.serialize(function() {
        db.run('DELETE FROM songs WHERE playlist_name = ?' , [playlistName] , function(err) {
            if(err) {
                console.error(err)
                return
            }

            db.run('DELETE FROM playlists WHERE playlist_name = ?' , [playlistName] , function(err) {
                if(err) 
                    console.error(err)

                res.send('Playlist and its songs deleted')
                console.log('Playlist and its songs deleted')
            })
        });
    });
}

exports.viewAccounts = function(req , res) {
    if(!req.session.authorized) {
        res.redirect('/login')
        return
    }

    db.all('SELECT * FROM users' , [] , function(err , row) {
        if(err) {
            console.error(err)
            return
        }
        res.render('accounts' , { users : row , isAdmin : req.session.isAdmin , username: req.session.username })
    });
}

exports.showSongs = function(req , res) {
    var playlistName = req.query.playlistName

    //Show the songs on the selected playlist
    db.all('SELECT * FROM songs WHERE playlist_name = ?' , [playlistName] , function(err, rows) {
        if (err) {
            console.error(err)
            res.render('playlists', { error: "Error retrieving playlists" })
            return
        }
        res.send({ songs: rows , isAdmin : req.session.isAdmin }); 
    });
}

//TO DO LIST:
//2. Admin privileges: Can see every user, can see every playlist on the dashboard
//3. Add songs to playlists

