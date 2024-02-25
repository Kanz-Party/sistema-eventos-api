
module.exports = app => {
    const qrcodes = require("../controllers/qrcodes.controller.js");
    var router = require("express").Router();

    router.post("/", qrcodes.create);

    router.get("/:auth/:qrcode", qrcodes.findByHash);

    router.post("/entrada/:auth/:qrcode", qrcodes.entrada);

    app.use('/qrcodes', router);
};
