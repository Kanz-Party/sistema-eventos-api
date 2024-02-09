

module.exports = app => {
    const qrcodes = require("../controllers/qrcodes.controller.js");

    var router = require("express").Router();

    router.post("/", qrcodes.create);

    app.use('/qrcodes', router);
};
