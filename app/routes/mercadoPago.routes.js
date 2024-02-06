module.exports = app => {
    const mercadoPago = require("../controllers/mercadoPago.controller.js");
    const verificarToken = require("../middlewares/Auth.js");

    var router = require("express").Router();

    router.post("/", mercadoPago.createPayment);

    app.use('/api/mercadoPago', router);
};
