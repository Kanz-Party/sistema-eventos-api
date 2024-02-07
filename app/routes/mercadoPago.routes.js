module.exports = app => {
    const mercadoPago = require("../controllers/mercadoPago.controller.js");
    const verificarSessao = require("../middlewares/Auth.js");

    var router = require("express").Router();

    router.post("/create", verificarSessao, mercadoPago.createPayment);

    router.post("/receive", mercadoPago.receivePayment);

    app.use('/api/mercadoPago', router);
};
