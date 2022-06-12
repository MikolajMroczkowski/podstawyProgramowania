const sqlite3 = require("sqlite3").verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const HexHelper = require('../modules/hex')
const uuidv6 = require('uuid-with-v6');
const uuid = uuidv6.v6setup();

hexHelper = new HexHelper()

class database {
    connStr = ""
    example = ""

    constructor(connStr, example) {
        this.connStr = connStr;
        this.example = example;
    }

    initDb() {
        try {
            const exampleStr = fs.readFileSync(this.example, 'utf8');
            const db = new sqlite3.Database(this.connStr);
            const exampleQueryArr = exampleStr.split(';')
            for (const argumentsKey in exampleQueryArr) {
                db.run(exampleQueryArr[argumentsKey]);
            }
           // db.run('DELETE FROM sessions WHERE 1=1')
            db.close();
        } catch (err) {
            console.error(err);
        }

    }

    deleteSession(session) {
        const db = new sqlite3.Database(this.connStr);
        db.run(`DELETE
                FROM sessions
                WHERE sessionUuid = X'${hexHelper.str2hex(session)}'`)
        db.close();
    }

    checkSession(session, callback) {
        const db = new sqlite3.Database(this.connStr);
        db.all(`SELECT u.id as id, u.username as username
                FROM sessions s,
                     users u
                WHERE s.user = u.id
                  AND s.sessionUuid = '${session}'`, function (err, rows) {
            if (err) return callback(err);
            rows.forEach(function (row) {
                return callback([true, row.id, row.username]);
            });
            if (rows.length === 0) {
                return callback(false);
            }
            db.close();
        });

    }

    createUser(name, password, callback) {
        var connStr = this.connStr
        bcrypt.hash(password, 5, function (err, hash) {
            if (err) {
                return callback(err);
            }
            const db = new sqlite3.Database(connStr);
            db.all(`SELECT *
                    FROM users
                    WHERE username = X'${hexHelper.str2hex(name)}'`, function (err, rows) {
                if (err) return callback(err);
                if (rows.length === 0) {
                    db.serialize(() => {
                        db.run(`INSERT INTO users (username, password)
                                VALUES (X'${hexHelper.str2hex(name)}', '${hash}')`)
                    });
                    return callback(true)
                } else {
                    return callback(false)
                }
                db.close();
            });
        });
    }

    createSession(name, password, callback) {
        var connStr = this.connStr
        const db = new sqlite3.Database(connStr);
        db.all(`SELECT *
                FROM users
                WHERE username = X'${hexHelper.str2hex(name)}'`, function (err, rows) {
            if (err) return callback(db, err);
            rows.forEach(function (row) {
                var hash = row.password;
                bcrypt.compare(password, hash, function (err, result) {
                    var sessUuid = "";
                    if (result) {
                        db.serialize(() => {
                            sessUuid = uuid();
                            db.run(`INSERT INTO sessions (user, sessionUuid)
                                    VALUES ('${row.id}', '${sessUuid}')`)

                        });
                    }
                    db.close();
                    return callback(result, sessUuid);
                });
            });
            if (rows.length === 0) {
                db.close();
                return callback(false);
            }
        });

    }

    getProblems(user, callback) {
        const db = new sqlite3.Database(this.connStr);
        db.all(`SELECT *
                FROM toSolve
                WHERE user = ${user}`, function (err, rows) {
            var problems = [];
            rows.forEach(function (row) {
                var o = new Object;
                o.name = row.name;
                o.id = row.id;
                o.uuid = row.uuid;
                problems.push(o)
            });
            if (rows.length === 0) {
                db.close();
                return callback(false)
            } else {
                db.close();
                return callback(problems)
            }

        });
    }

    addProblem(user, name, callback) {
        var unique = uuid()
        const db = new sqlite3.Database(this.connStr);
        db.run(`INSERT INTO toSolve (user, name, uuid)
                VALUES (${user}, '${name}', '${unique}')`)
        db.close();
        callback(true);
    }

    removeProblem(unique, callback) {
        const db = new sqlite3.Database(this.connStr);
        db.run(`DELETE
                FROM toSolve
                WHERE uuid = '${unique}'`)
        db.close();
        callback();
    }

    getPoints(user, problem, callback) {
        const db = new sqlite3.Database(this.connStr);
        db.all(`SELECT p.point as point, p.id as id
                FROM points p,
                     toSolve s,
                     users u
                WHERE p.solve = s.id
                  AND s.user = u.id
                  AND u.id = ${user}
                  AND s.uuid = '${problem}'`, function (err, rows) {
            var problems = [];
            rows.forEach(function (row) {
                var o = new Object;
                o.point = row.point;
                o.id = row.id;
                problems.push(o)
            });
            if (rows.length === 0) {
                db.close();
                return callback(false)
            } else {
                db.close();
                return callback(problems)
            }

        });
    }

    addPoint(point, problem, user, callback) {
        const db = new sqlite3.Database(this.connStr);
        db.all(`SELECT *
                FROM toSolve
                WHERE uuid = '${problem}'
                  AND user = ${user}`, function (err, rows) {
            rows.forEach(function (row) {
                db.run(`INSERT INTO points (solve, point)
                        VALUES (${row.id}, '${point}')`)
                db.close()
                return callback(true)
            });
            if (rows.length === 0) {
                db.close();
                return callback(false)

            }
        });
    }
    removePoint(point,problem,callback){
        const db = new sqlite3.Database(this.connStr);
        db.all(`SELECT *
                FROM toSolve
                WHERE uuid = '${problem}'`, function (err, rows) {
            rows.forEach(function (row) {
                db.run(`DELETE
                        FROM points
                        WHERE id = ${point} AND solve=${row.id}`)
                db.close()
                return callback(true)
            });
            if (rows.length === 0) {
                db.close();
                return callback(false)

            }
        });

    }
}


module.exports = database