const public = "public/"
const express = require('express');
const app = express()
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const hbs = require('express-handlebars');

// Returns an array with all flipbook names
function getFlipbookNames() {
  return fs.readdirSync(public).filter(function (file) {
    return fs.statSync(public + file).isDirectory();
  });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.engine('handlebars', hbs());
app.set('view engine', 'handlebars');

app.use(express.static('views/'));

/** Handlebar Routes */
app.get("/", function(req, res) {
    res.render("home.handlebars", {
        layout: false,
        flipbooks: getFlipbookNames(),
    });
});

app.get("/reference", function(req, res) {
    res.render("reference.handlebars", {
        layout: false,
        flipbooks: getFlipbookNames(),
    });
});

app.get("/create", function(req, res) {
    res.render("create-flipbook.handlebars", {
        layout: false,
        flipbooks: getFlipbookNames(),
    });
});

app.get("/draw/:flipbookName", function(req, res) {
    res.render("draw.handlebars", {
        layout: false,
        flipbookName: req.params.flipbookName,
    });
});

app.get("/flipbookinfo/:flipbookName", function(req, res) {
    var numPages = "";
    try {
        var files = fs.readdirSync(public + req.params.flipbookName);
        numPages = files.length.toString();
    } catch(err) {
        numPages = "0";
    }
    res.render("home-selected.handlebars", {
        layout: false,
        flipbooks: getFlipbookNames(),
        flipbookName: req.params.flipbookName,
        numPages: numPages,
    })
});

/** RESTful API routes **/
// Returns the image from :flipbookName given :pageNum
app.get("/flipbooks/:flipbookName/:pageNum", function(req, res) {
    const flipbookName = req.params.flipbookName;
    const pageNum = req.params.pageNum;
    fs.readFile(public + flipbookName + "/" + pageNum + ".base64", function (err, data) {
        if(err) {
            res.send(err);
        } else {
            res.send(data);
        }
    });
});

// Returns the number of images in a specific flipbook. Will also return 0
// if a flipbook doesn't exist or has no pages.
app.get("/numpages/:flipbookName", function(req, res) {
    try {
        var files = fs.readdirSync(public + req.params.flipbookName);
        res.send(files.length.toString());
    } catch(err) {
        res.send("0");
    }
});

app.get("/delete/:flipbookName/:pageNum", function(req, res) {
    const flipbookName = req.params.flipbookName;
    const pageNum = req.params.pageNum;
    fs.unlink(public + flipbookName + "/" + pageNum + ".base64", function(err) {
        if(err){
            res.send("ERROR: Cannot delete file");
            console.log("File doesn't exist : " + err);
        } else {
            res.send("File successfully deleted.");
            console.log("Successfully deleted page " + pageNum + " from " + flipbookName);
        }
    });
});

app.post("/flipbooks/:flipbookName/:pageNum", function(req, res) {
    // Decode base64 and then save the resulting image.
    //img = req.body.img.replace(/^data:image\/png;base64,/, "");
    img = req.body.img;
    console.log(public + req.params.flipbookName + "/" + req.params.pageNum + ".base64");
    
    fs.writeFile(public + req.params.flipbookName + "/" + req.params.pageNum + ".base64", img, function (err) {
        if(err){
            console.log(err);
        } else {
            console.log("Image successfully saved!");
        }
    });

    res.send("Successfully uploaded image");
});

app.get("/createfolder/:folderName", function(req, res) {
    const folderName = req.params.folderName;
    fs.mkdir(public + folderName, (err) => {
        if(err) {
            res.send("ERROR: Directory already exists.");
        } else {
            console.log("Folder successfully created.");
            res.send("Folder successfully created.");
        }
    });
});

// Returns a list of flipbooks, and the number of pages in each flipbook, 
// in the format [(flipbookName, numPages), ...]
app.get("/flipbooks", function(req, res) {
    var numPages = []
    var flipbookNames = getFlipbookNames();
    flipbookNames.forEach(function(item, index) {
        try {
            var files = fs.readdirSync(public + req.params.flipbookName);
            numPages.push(files.length.toString());
        } catch(err) {
            numPages.push(0);
        }
    });
    var result = flipbookNames.map(function(curr, index) {
        return [curr, numPages[index]];
    });
    res.send(result);
});

app.listen(10001, () => console.log("Listening on port 10001"));
