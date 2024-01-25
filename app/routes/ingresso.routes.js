module.exports = app => {
    const ingresso = require("../controllers/ingresso.controller.js");
  
    var router = require("express").Router();
  
    // // Create a new ingresso
    // router.post("/", ingresso.create);
  
    // Retrieve all ingressos
    router.get("/", ingresso.findAll);
  
    // // Retrieve a single ingresso with id
    // router.get("/:id", ingresso.findOne);
  
    // // Update a ingresso with id
    // router.put("/:id", ingresso.update);
  
    // // Delete a ingresso with id
    // router.delete("/:id", ingresso.delete);
  
    // // Delete all ingresso
    // router.delete("/", ingresso.deleteAll);
  
    app.use('/api/ingressos', router);
  };
  