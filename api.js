const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');
const axios = require('axios');
app.use(cors());

app.use((req, res, next) => { 
    console.log(req.url)
    next()
})
const { connectDB } = require("./src/db/dbconnection");
const constant = require('./src/config/const_credential');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { updatePlayerSelected } = require('./src/config/cronjob');
updatePlayerSelected.start();
app.use(express.static(path.join(__dirname, '/public')));

// global.subscribeParams = [];
const flash = require("connect-flash");
app.use(flash());
app.use("/api", require("./src/api/routes/route"));

const port = constant.PORT_api;
connectDB();

app.listen(port, () => {
    console.log(`server started on port ${port}`);
});
