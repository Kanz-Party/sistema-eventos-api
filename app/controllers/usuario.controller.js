const Usuario = require("../models/usuario.model.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const getUsuarioId = require("../middlewares/Auth.js");
require('dotenv').config();




// Create and Save a new Usuario
exports.create = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a Usuario
  const usuario = new Usuario({
    nome: req.body.nome,
    cpf: req.body.cpf,
    email: req.body.email,
    telefone: req.body.telefone,
    senha: req.body.senha
  });

  // Save Usuario in the database
  Usuario.create(usuario, (err, data) => {
    console.log(err);
    if (err)
      res.status(500).send({
        message:
          err.message || "Usuário já cadastrado."
      });
    else res.send(data);
  });
};

exports.createWithLogin = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Conteúdo não pode ser vazio!"
    });
  }

  // Create a Usuario
  const usuario = new Usuario({
    nome: req.body.nome,
    cpf: req.body.cpf,
    email: req.body.email,
    telefone: req.body.telefone,
    senha: req.body.senha
  });



  // Save Usuario in the database
  Usuario.createWithLogin(usuario, (err, data) => {
    console.log(err);
    if (err)
      res.status(500).send({
        message:
          err.message || "Usuário já cadastrado."
      });
    else res.send(data);
  });
}

// Retrieve all Usuarios from the database.
exports.findAll = (req, res) => {
  const nome = req.query.nome;

  Usuario.getAll(nome, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving usuarios."
      });
    else res.send(data);
  });
};

// Find a single Usuario by Id
exports.findOne = (req, res) => {
  Usuario.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found Usuario with id ${req.params.id}.`
        });
      } else {
        res.status(500).send({
          message: "Error retrieving Usuario with id " + req.params.id
        });
      }
    } else res.send(data);
  });
};

// Update a Usuario identified by the id in the request
exports.update = (req, res) => {
  // Validate Request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  Usuario.updateById(
    req.params.id,
    new Usuario(req.body),
    (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            message: `Not found Usuario with id ${req.params.id}.`
          });
        } else {
          res.status(500).send({
            message: "Error updating Usuario with id " + req.params.id
          });
        }
      } else res.send(data);
    }
  );
};

// Delete a Usuario with the specified id in the request
exports.delete = (req, res) => {
  Usuario.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found Usuario with id ${req.params.id}.`
        });
      } else {
        res.status(500).send({
          message: "Could not delete Usuario with id " + req.params.id
        });
      }
    } else res.send({ message: `Usuario was deleted successfully!` });
  });
};

// Delete all Usuarios from the database.
exports.deleteAll = (req, res) => {
  Usuario.removeAll((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all usuarios."
      });
    else res.send({ message: `All Usuarios were deleted successfully!` });
  });
};

exports.login = (req, res) => {
  const email = req.body.email;
  const senha = req.body.senha;

  if (!email || !senha) {
    return res.status(400).send({ message: "Email e senha são obrigatórios." });
  }

  // Buscar usuário pelo email
  Usuario.findByEmail(email, (err, usuario) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).send({ message: "Usuário não encontrado." });
      } else {
        return res.status(500).send({ message: "Erro ao buscar usuário." });
      }
    }

    console.log('usuario', usuario);

    console.log('senha', senha);

    // Comparar a senha fornecida com a senha do usuário encontrado
    bcrypt.compare(senha, usuario.usuario_senha, (err, isMatch) => {
      if (err) {
        return res.status(500).send({ message: "Erro ao verificar senha." });
      }

      if (isMatch) {
        const token = jwt.sign(
          { id: usuario.usuario_id }, // Use o ID do usuário como payload do token
          process.env.JWT_SECRET, // chave secreta para assinar o token
          { expiresIn: '1h' } // opção para definir a validade do token
        );

        res.send({
          message: "Login bem-sucedido.",
          usuario: {
            id: usuario.usuario_id,
            nome: usuario.usuario_nome,
            email: usuario.usuario_email
          },
          token: token
        });
      } else {
        res.status(401).send({ message: "Senha incorreta." });
      }
    });
  });
};


exports.findOneById = (req, res) => {
  getUsuarioId(req, res, () => {
    Usuario.findById(req.usuarioId, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            message: `Not found Usuario with id ${req.usuarioId}.`
          });
        } else {
          res.status(500).send({
            message: "Error retrieving Usuario with id " + req.usuarioId
          });
        }
      } else res.send(data);
    });
  });
};