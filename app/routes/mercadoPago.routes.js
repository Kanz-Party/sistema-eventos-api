module.exports = app => {
    const mercadoPago = require("../controllers/mercadoPago.controller.js");
    const verificarSessao = require("../middlewares/Auth.js");

    var router = require("express").Router();

    router.post("/create", mercadoPago.createPayment);

    router.post("/receive/:carrinho_id/:usuario_id", mercadoPago.receivePayment);

    app.use('/mercadoPago', router);
};
