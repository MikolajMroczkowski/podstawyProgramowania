const distance = require("google-distance-matrix");

class solver {
    req = "";
    res = "";
    pointsArr = [];
    points = [];
    problemUuid = "";
    canSolve = true;
    distance = Object();
    callback = "";
    geocoder = Object();

    constructor(pointsArr, problemUuid, distance, geocoder, callback) {
        this.pointsArr = pointsArr;
        this.problemUuid = problemUuid;
        this.canSolve = this.pointsArr.length >= 3
        this.distance = distance
        this.callback = callback
        this.geocoder = geocoder
        this.pointsLocation = []
        var obj = this;
        for (const reqKey in this.pointsArr) {
            this.points.push(this.pointsArr[reqKey].point)
        }
        geocoder.batchGeocode(this.points, function (err, results) {
            for (let i = 0; i < results.length; i++) {
                var o = new Object();
                o.lat = results[i].value[0].latitude
                o.lng = results[i].value[0].longitude
                obj.pointsLocation.push(o)
            }
            obj.solve()
        });
        console.log(this.points)
    }
    solve() {
        if (!this.canSolve) {
            return false;
        }
        this.getPointsDistance(this.points)

    }

    getPointsDistance(points) {
        const distance = this.distance
        const obj = this;
        var distancesArr = [];
        distance.matrix(points, points, function (err, distances) {
            if (err) {
                return console.log(err);
            }
            if (!distances) {
                return console.log('no distances');
            }
            if (distances.status == 'OK') {
                for (var i = 0; i < points.length; i++) {
                    for (var j = 0; j < points.length; j++) {
                        var origin = distances.origin_addresses[i];
                        var destination = distances.destination_addresses[j];
                        if (distances.rows[0].elements[j].status == 'OK') {
                            var distance = distances.rows[i].elements[j].distance.text;
                            var o = Object();
                            o.distance = distance
                            o.from = i
                            o.to = j
                            distancesArr.push(o)

                        }
                    }
                }
            }
            obj.makeArr(distancesArr)
        });
    }

    makeArr(distancesArr) {
        var countArr = []
        for (const arrKey in distancesArr) {
            countArr[distancesArr[arrKey].from] = []
        }
        for (const arrKey in distancesArr) {
            var o = new Object();
            o.to = distancesArr[arrKey].to
            o.from = distancesArr[arrKey].from
            var isKm = distancesArr[arrKey].distance.includes("km")
            distancesArr[arrKey].distance = distancesArr[arrKey].distance.replace(" ", "").replace("k", "").replace("m", "")
            o.distance = isKm ? distancesArr[arrKey].distance * 1000 : distancesArr[arrKey].distance * 1
            countArr[o.from][o.to] = o.distance
        }
        this.makePaths(countArr)
    }

    makePaths(countArr) {
        this.callback(this.pointsLocation,this.points,countArr)
    }
    combination(str,k){
        var t = [];
        for (let i = 0; i < k; i++) {
            t[i] = i
        }
        t[k-1]--;

    }
}

module.exports = solver;