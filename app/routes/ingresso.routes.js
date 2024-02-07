module.exports = app => {
    const ingresso = require("../controllers/ingresso.controller.js");
  
    var router = require("express").Router();

    router.get("/", ingresso.findAll);
  
    app.use('/api/ingressos', router);
  };
  