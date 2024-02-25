module.exports = app => {
  const empresa = require("../controllers/empresa.controller.js");
  var router = require("express").Router();

  router.get("/hash-leitor/:senha", empresa.hashLeitor);
 
  app.use('/empresas', router);
};
