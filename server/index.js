const express = require("express");
const app = express();
const path = require("path");
// const fs = require("fs");
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');
// const firebase = require('firebase');
// const admin = require('firebase-admin');
// const config = require('./config');
// firebase.initializeApp(config);
// admin.initializeApp(config);
// const storage = firebase.storage();
// var bucket = admin.storage().bucket();

const { Storage } = require('@google-cloud/storage');
let storage;
if (process.env.NODE_ENV == 'production') {
    storage = new Storage({
        projectId: "ocrdata-50808",
        credentials: JSON.parse(process.env['SERVICEACCOUNT'])
    });
} else {
    storage = new Storage({
        projectId: "ocrdata-50808",
        keyFilename: "server/serviceAccountKey.json"
    });
}
const bucket = storage.bucket("gs://ocrdata-50808.appspot.com");
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))


app.get("/", (req, res) => {
    res.render("index.html");
})
const charlist = require("./characters.json");
app.get("/characters", (req, res) => {
    res.send(charlist);
})
// app.get("/test/:id", (req, res) => {
//     const image = bucket.file(`char${req.params.id}/001.png`);
//     image.createReadStream()
//         .on('error', function (err) { res.send("Error"); })
//         .on('response', function (response) {
//             // Server connected and responded with the specified status and headers.
//         })
//         .on('end', function () {
//             // The file is fully downloaded.
//             res.send("Success");
//         })
//         .pipe(fs.createWriteStream('out2.png'));
// })
app.post("/dataentry", (req, res) => {
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    const selectedchar = charlist.filter(char => char.char == req.body.char);
    const label = selectedchar[0].label;
    const image = bucket.file(`char${label}/${uuidv4()}.png`);
    const imageBuffer = Buffer.from(base64Data, 'base64');
    image.save(imageBuffer, {
        metadata: { contentType: 'image/png' },
        public: true,
        validation: 'md5'
    }, function (error) {

        if (error) {
            console.log("Error" + error);
        }

        console.log(`char${label} written`);
        res.status(200).send("" + label);
    });
    // fs.mkdir(`data/char${label}`, function (err) { console.log(err); });
    // fs.writeFile(`data/char${label}/out.png`, base64Data, 'base64', function (err) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log(`char${label} written`);
    //     }
    // });
    // res.status(200).send("അ");
})

app.listen("3000", () => {
    console.log("Running on 3000");
})