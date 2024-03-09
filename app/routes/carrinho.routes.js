module.exports = app => {
    const carrinho = require("../controllers/carrinho.controller.js");
  
    var router = require("express").Router();
  
    // Create a new carrinho
    router.post("/", carrinho.create);

    router.get("/carrinho/:carrinho_hash", carrinho.findByHash);

    router.get("/carrinhos/meus-carrinhos", carrinho.getMeusCarrinhos);
    
    router.get("/carrinho/meus-qrcodes/:carrinho_id", carrinho.getMeusQrcodes);
  
    app.use('/carrinhos', router);
  };
  