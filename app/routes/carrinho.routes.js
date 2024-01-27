module.exports = app => {
    const carrinho = require("../controllers/carrinho.controller.js");
  
    var router = require("express").Router();
  
    // Create a new carrinho
    router.post("/", carrinho.create);
  
    app.use('/api/carrinhos', router);
  };
  