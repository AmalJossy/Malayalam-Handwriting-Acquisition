const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

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
app.post("/dataentry", (req, res) => {
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    const selectedchar = charlist.filter(char => char == req.body.char)[0];
    console.log(selectedchar);
    if (!selectedchar) {
        console.log('Nope');
        res.status(403).send("Nope");
    }
    else {
        const image = bucket.file(`${selectedchar}/${uuidv4()}.png`);
        const imageBuffer = Buffer.from(base64Data, 'base64');
        image.save(imageBuffer, {
            metadata: { contentType: 'image/png' },
            public: true,
            validation: 'md5'
        }, function (error) {

            if (error) {
                console.log("Error" + error);
            }

            console.log(`${selectedchar} written`);
            res.status(200).send(selectedchar);
        });
    }
})

app.listen(process.env.PORT || 3000, () => {
    console.log("Running...");
})