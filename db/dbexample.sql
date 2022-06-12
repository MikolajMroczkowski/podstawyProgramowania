create table IF NOT EXISTS users
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username text not null unique,
    password text not null
);

create table IF NOT EXISTS toSolve
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name text not null,
    uuid text not null unique,
    user INTEGER not null,
    FOREIGN KEY (user)  REFERENCES users(id) ON DELETE cascade
);

create table IF NOT EXISTS points
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    solve INTEGER  not null,
    point text not null,
    FOREIGN KEY (solve) REFERENCES toSolve(id) ON DELETE cascade
);

create table IF NOT EXISTS path
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    solve      INTEGER not null,
    point      INTEGER not null,
    pointOrder INTEGER,
    FOREIGN KEY (solve) REFERENCES toSolve(id) ON DELETE cascade
);
create table IF NOT EXISTS sessions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionUuid text not null unique,
    user integer not null,
    FOREIGN KEY (user) REFERENCES users(id) ON DELETE cascade
)