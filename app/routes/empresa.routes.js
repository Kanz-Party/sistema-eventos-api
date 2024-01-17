module.exports = app => {
  const empresa = require("../controllers/empresa.controller.js");

  var router = require("express").Router();

  // Create a new empresa
  router.post("/", empresa.create);

  // Retrieve all empresa
  router.get("/", empresa.findAll);

  // Retrieve a single empresa with id
  router.get("/:id", empresa.findOne);

  // Update a empresa with id
  router.put("/:id", empresa.update);

  // Delete a empresa with id
  router.delete("/:id", empresa.delete);

  // Delete all empresa
  router.delete("/", empresa.deleteAll);

  app.use('/api/empresas', router);
};
