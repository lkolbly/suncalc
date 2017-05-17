var SunCalc = require('suncalc');
var math = require('math');
var pdf = require('pdfkit');
var express = require('express');
var uuid = require('node-uuid');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;

var DB = null;
MongoClient.connect("mongodb://mongo/solar", function(err,db) {
    console.log("Connected!");
    DB = db;
});

function renderPdf(dates, loc, cb) {
    function deg(v) {
	return v * 180.0 / 3.14159265;
    }

    function getFloorPos(tm) {
	var pos = SunCalc.getPosition(tm, loc.lat, loc.lon);

	// Convert that to X,Y (+X = E, +Y = N)
	var x = 1.0 / math.tan(pos.altitude) * math.sin(pos.azimuth)
	var y = -1.0 / math.tan(pos.altitude) * math.cos(pos.azimuth)
	return {x: x, y: y};
    }

    var now = new Date(2017,5,16,12,0,0,0);

    var times = SunCalc.getTimes(now, loc.lat, loc.lon);

    console.log(times.sunset);

    console.log(getFloorPos(now));
    //now.setFullYear(2114);
    //console.log(getFloorPos(now));

    var doc = new pdf();

    var centerx = 8.5*72/2;
    var centery = 11*72/2;

    doc.text("N", centerx, 72);
    doc.text("E", centerx*2-72, centery);

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function formatDate(d) {
	var hours = d.getHours();
	var am = "AM";
	if (hours >= 12) {
	    am = "PM";
	}
	if (hours > 12) {
	    hours -= 12;
	}

	var min = d.getMinutes()+"";
	while (min.length < 2) min = "0"+min;
	return months[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear()+" "+
	    hours+":"+min+am;
    }

    // Compass rose
    doc.save().scale(0.5,0.5).image("compass-rose.png", 2*1*72, 2*1*72).restore();

    // Draw the dots

    doc.moveTo(centerx-0.5*72,centery)
	.lineTo(centerx,centery)
	.lineTo(centerx,centery+0.5*72)
	.stroke();

    doc.text("3 inch spire", centerx+0.05*72, centery-0.1*72);
    for (var i=0; i<dates.length; i++) {
	//now.setMonth(i);
	now = new Date(dates[i].year, dates[i].month, dates[i].day, 12, 0,0,0);
	var times = SunCalc.getTimes(now, loc.lat, loc.lon);
	var p;
	//console.log(dates[i].hour);
	if (dates[i].hour == -1) {
//	    p = getFloorPos(times.solarNoon);
	    now = times.solarNoon;
	} else {
	    now.setHours(dates[i].hour);
	}
	p = getFloorPos(now);
	//console.log(now+": "+p.x+","+p.y);
	p.x = p.x*3.0*72.0 + centerx;
	p.y = p.y*3.0*72.0 + centery;
	doc.circle(p.x,p.y, 5).stroke();

	var txt = formatDate(now);
	if (dates[i].customText != "") {
	    txt = dates[i].customText;
	}

	//doc.text("  "+txt, p.x,p.y);
    }

    // Draw the cone
    var peakx = 5*72;
    var peaky = 6*72;
    doc.moveTo(peakx,peaky)
	.lineTo(peakx+0.5*72,peaky+3*72)
	.lineTo(peakx+0.5*72, peaky+3.5*72)
	.lineTo(peakx-0.5*72, peaky+3.5*72)
	.lineTo(peakx-0.5*72, peaky+3*72)
	.lineTo(peakx, peaky+3*72)
	.lineTo(peakx-0.5*72,peaky+3*72)
	.lineTo(peakx,peaky)
	.stroke();
    doc.moveTo(peakx,peaky)
	.lineTo(peakx,peaky+3*72)
	.lineTo(peakx+0.5*72, peaky+3*72)
	.moveTo(peakx,peaky+3*72)
	.lineTo(peakx,peaky+3.5*72)
	.dash(5)
	.stroke();
    doc.text("Cut & fold for 3 inch spire", peakx+0.5*72, peaky);
    doc.text("Cut along solid, fold along dotted", peakx+0.5*72, peaky+1*72);

    doc.addPage();
    var s = "";
    s += "If you put a 1-meter tall object at 0,0...";
    s += "\n";
    for (var i=0; i<dates.length; i++) {
	now = new Date(dates[i].year, dates[i].month, dates[i].day, 12, 0,0,0);
	var times = SunCalc.getTimes(now, loc.lat, loc.lon);
	var p;
	if (dates[i].hour == -1) {
//	    p = getFloorPos(times.solarNoon);
	    now = times.solarNoon;
	} else {
	    now.setHours(dates[i].hour);
	}
	p = getFloorPos(now);
	p.x = Math.round(p.x*100) / 100;
	p.y = Math.round(p.y*100) / 100;

	var txt = formatDate(now);
	if (dates[i].customText != "") {
	    txt = dates[i].customText;
	}

	s += txt+" is "+p.x+"m E and "+p.y+"m S\n";
    }
    doc.text(s);

    doc.scale(0.5,0.5).image("qrcode.png", 2*6.5*72, 2*9*72);

    doc.output(cb);
}

var app = express();

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/', function(req, res) {
    res.sendfile("index.html");
});
app.get('/main.js', function(req, res) {
    res.sendfile("main.js");
});
app.get('/logo.png', function(req, res) {
    res.sendfile("logo.png");
});
app.post('/genpdf', function(req,res) {
    console.log("Generating PDF....");
    res.type("application/pdf");
    console.log(req.body.data);
    var loc = {lat: req.body.latitude,
	       lon: req.body.longitude};
    renderPdf(req.body.data, loc, function(string) {
	// TODO: Save it somewhere for 30 minutes, and return the ID
	//res.send(string);
	var coll = DB.collection("pdfdocs");
	var doc = {"id": uuid.v4(), "doc": new MongoDb.Binary(string), "insertAt": new Date()};
	res.end(JSON.stringify({id: doc.id}));
	console.log(doc.id);
	coll.insert(doc, function(err, res) {});
    });
});
app.get('/getpdf/:id', function(req,res) {
    //console.log(req.params.id);
    var coll = DB.collection("pdfdocs");
    coll.findOne({"id": req.params.id}, function(err, item) {
	if (err) {
	    console.log(err);
	    res.send(err);
	} else {
	    res.end(item.doc.buffer, "binary");
	}
    });
});

app.listen(9020);
