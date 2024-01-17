const Empresa = require("../models/empresa.model.js");

// Create and Save a new Empresa
exports.create = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create an Empresa
  const empresa = new Empresa({
    descricao: req.body.descricao,
    telefone: req.body.telefone,
    email: req.body.email,
    senha: req.body.senha
  });

  // Save Empresa in the database
  Empresa.create(empresa, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Empresa."
      });
    else res.send(data);
  });
};

// Retrieve all Empresas from the database.
exports.findAll = (req, res) => {
  const descricao = req.query.descricao;

  Empresa.getAll(descricao, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving empresas."
      });
    else res.send(data);
  });
};

// Find a single Empresa by Id
exports.findOne = (req, res) => {
  Empresa.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found Empresa with id ${req.params.id}.`
        });
      } else {
        res.status(500).send({
          message: "Error retrieving Empresa with id " + req.params.id
        });
      }
    } else res.send(data);
  });
};

// Update an Empresa identified by the id in the request
exports.update = (req, res) => {
  // Validate Request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  Empresa.updateById(
    req.params.id,
    new Empresa(req.body),
    (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            message: `Not found Empresa with id ${req.params.id}.`
          });
        } else {
          res.status(500).send({
            message: "Error updating Empresa with id " + req.params.id
          });
        }
      } else res.send(data);
    }
  );
};

// Delete an Empresa with the specified id in the request
exports.delete = (req, res) => {
  Empresa.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found Empresa with id ${req.params.id}.`
        });
      } else {
        res.status(500).send({
          message: "Could not delete Empresa with id " + req.params.id
        });
      }
    } else res.send({ message: `Empresa was deleted successfully!` });
  });
};

// Delete all Empresas from the database.
exports.deleteAll = (req, res) => {
  Empresa.removeAll((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all empresas."
      });
    else res.send({ message: `All Empresas were deleted successfully!` });
  });
};
