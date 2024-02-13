module.exports = app => {
    const carrinho = require("../controllers/carrinho.controller.js");
  
    var router = require("express").Router();
  
    // Create a new carrinho
    router.post("/", carrinho.create);

    router.get("/carrinho/:carrinho_hash", carrinho.findByHash);

    router.get("/ingressos/meus-ingressos", carrinho.getMeusIngressos);
    
  
    app.use('/carrinhos', router);
  };
  