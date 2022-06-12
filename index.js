var distance = require('google-distance-matrix');
var config = require('config.json')('./config.json');
var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
const database = require('./db/database')
const Solver = require('./modules/solver')
const request = require('request');
const {query} = require("express");
const NodeGeocoder = require('node-geocoder');

var app = express();
var db = new database(config.db.connStr,config.db.example)

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(__dirname + '/static'));
app.use(cookieParser())
db.initDb();
distance.key(config.google.key);

app.set('view engine', 'ejs');
const options = {
    provider: 'google',
    apiKey: config.google.key, // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);


app.get('/', function(req, res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.getProblems(data[1],function (problemArr) {
                        render(req,res,"main",{error:"",problems:problemArr})
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
});
app.get('/removeProblem', function(req, res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.removeProblem(req.query.id,function () {
                        res.redirect('/')
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
});
app.get('/removePoint', function(req, res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.removePoint(req.query.id,req.query.problem,function () {
                        res.redirect('/problem?id='+req.query.problem)
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
});
app.post('/',function (req,res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.addProblem(data[1],req.body.name,function (data) {
                        res.redirect('/')
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
})
app.get('/login', function(req, res) {
    res.render('login',{error: ""})
});
app.post('/login', function(req, res) {
    db.createSession(req.body.login,req.body.password,function (data,sessid) {
        if(data){
            res.cookie('auth',sessid, { maxAge: 10800000 });
            res.redirect('/')
        }
        else{
            res.render('login',{error: "Wprowadź poprawne dane"})
        }
    });

});
app.get('/register', function(req, res) {
    res.render('register',{error: ""})
});
app.get('/problem', function (req,res){
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.getPoints(data[1],req.query.id,function (pointsArr) {
                        render(req,res,"problem",{error:"",points:pointsArr,problem:req.query.id})
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
})
app.post('/problem',function (req,res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.addPoint(req.body.point,req.body.problem,data[1],function (data) {
                        res.redirect('/problem?id='+req.body.problem)
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
})
app.get('/autocomplete',function (req,res) {
    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded'
    };
    var options = {
        url: "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        method: 'GET',
        headers: headers,
        qs: {
            key: config.google.key,
            input: req.query.q,
            types: ['(address)'],
            componentRestrictions: {country: 'Pl'}
        }
    };
    request(options, function (error, response, body) {
        res.send(body)
    });
})
app.post('/register', function(req, res) {
    if(req.body.password===req.body.repassword){
        db.createUser(req.body.login,req.body.password,function (data) {
            if(data){
                res.render('register',{error: "Użytkownik utworzony"})
            }
            else{
                res.render('register',{error: "Nazwa użytkownika zajęta"})
            }
        })
    }
    else{
        res.render('register',{error: "Hasła niezgodne"})
    }
});
app.get('/solve',function (req, res) {
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    db.getPoints(data[1],req.query.id,function (pointsArr) {

                        var solver = new Solver(pointsArr,req.query.id,distance,geocoder,function (path,names,table) {
                            res.render('solve',{path:path,problem:req.query.id,names:names,gk:config.google.key,table:table})
                        });
                        solver.solve()
                    })
                    return;
                }
            }
            res.redirect('/login')
        })
    }
});
function render(req,res,page,params){
    if(req.cookies.auth===undefined){
        res.redirect("/login")
    }
    else{
        db.checkSession(req.cookies.auth,function (data) {
            if(data){
                if(data.length===3){
                    res.render(page,params)
                    return
                }
            }
            res.redirect("/login")
        })
    }

}
app.listen(8080);
console.log('Server is listening on port 8080');
