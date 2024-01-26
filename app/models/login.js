const sql = require("./db.js");
const bcrypt = require('bcrypt');
const session = require('express-session');
const Usuario = require("../models/usuario.model.js");
const jwt = require('jsonwebtoken');
require('dotenv').config();



exports.login = (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    Usuario.findByEmail(email, (err, usuario) => {
        // ... Código anterior ...

        bcrypt.compare(senha, usuario.usuario_senha, (err, isMatch) => {
            // ... Código anterior ...

            if (isMatch) {
                console.log("usuario: ", usuario);
                // Cria um token JWT
                const token = jwt.sign(
                    { id: usuario.usuario_id }, // payload do token
                    process.env.JWT_SECRET, // chave secreta para assinar o token
                    { expiresIn: '1h' } // opção para definir a validade do token
                );

                // Salvar o token na sessão
                req.session.token = token;

                // Enviar o token como resposta
                res.send({ 
                    message: "Login bem-sucedido.",
                    usuario: {
                        nome: usuario.usuario_nome,
                        email: usuario.usuario_email
                    },
                    token: token // Enviar o token para o front-end
                });
            } else {
                res.status(401).send({ message: "Senha incorreta." });
            }
        });
    });
};