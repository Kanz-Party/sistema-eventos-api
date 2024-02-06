module.exports = app => {
  const usuarios = require("../controllers/usuario.controller.js");
  const verificarToken = require("../middlewares/Auth.js");

  var router = require("express").Router();

  // Create a new Usuario
  router.post("/", usuarios.create);

  // Login
  router.post("/login", usuarios.createWithLogin);

  router.post("/verifica_sessao", verificarToken);

  // Retrieve all Usuarios
  router.get("/", usuarios.findAll);

  // Retrieve a single Usuario with id
  router.get("/:id", usuarios.findOne);

  // Update a Usuario with id
  router.put("/:id", usuarios.update);

  // Delete a Usuario with id
  router.delete("/:id", usuarios.delete);

  // Delete all Usuarios
  router.delete("/", usuarios.deleteAll);

  app.use('/api/usuarios', router);
};
