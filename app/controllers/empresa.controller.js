const Empresa = require("../models/empresa.model.js");


// Create and Save a new Empresa
exports.hashLeitor = (req, res) => {
  Empresa.getHashLeitor(req.params, (err, data) => {
    if (err) {
      if (err.error === 'SENHA_INVALIDA') {
        res.status(401).send({
          err: "SENHA_INVALIDA",
          message: "Senha inválida!"
        });
      } else {
        res.status(500).send({
          err: "ERRO_BUSCAR_HASH_LEITOR",
          message: "Erro ao buscar hash leitor"
        });
      }
    } else res.send(data);
  });
  
}