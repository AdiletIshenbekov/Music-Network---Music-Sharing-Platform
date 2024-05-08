CREATE TABLE IF NOT EXISTS users (
    user_id         INTEGER     PRIMARY KEY,
    username        TEXT        NOT NULL,
    email           TEXT        UNIQUE          NOT NULL,
    password        TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id        INTEGER     PRIMARY KEY,
    username        TEXT        NOT NULL,
    password        TEXT        NOT NULL,
    email TEXT      UNIQUE      NOT NULL
);

CREATE TABLE IF NOT EXISTS playlists (
    playlist_id     INTEGER     PRIMARY KEY,
    playlist_name   TEXT        NOT NULL,
    username        TEXT        NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE IF NOT EXISTS songs (
    song_id         INTEGER     PRIMARY KEY,
    song_name       TEXT        NOT NULL,
    artist_name     TEXT        NOT NULL,
    playlist_name   INTEGER     NOT NULL,
    FOREIGN KEY (playlist_name) REFERENCES playlists(playlist_name)
);

