module.exports = app => {
    const mercadoPago = require("../controllers/mercadoPago.controller.js");
    const verificarSessao = require("../middlewares/Auth.js");

    var router = require("express").Router();

    router.post("/", verificarSessao, mercadoPago.createPayment);

    app.use('/api/mercadoPago', router);
};
