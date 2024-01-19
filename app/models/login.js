const sql = require("./db.js");
const bcrypt = require('bcrypt');
const session = require('express-session');
const Usuario = require("../models/usuario.model.js");


exports.login = (req, res) => {
    console.log(req.body);
    const email = req.body.email;
    const senha = req.body.senha;

    // Buscar usuário pelo email
    Usuario.findByEmail(email, (err, usuario) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({ message: "Usuário não encontrado." });
            } else {
                res.status(500).send({ message: "Erro ao buscar usuário." });
            }
        }
        

        bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
            if (isMatch) {
                req.session.usuario = usuario; // Salvar usuário na sessão
                res.send({ message: "Login bem-sucedido." });
            } else {
                res.status(401).send({ message: "Senha incorreta." });
            }
        });
    });
};