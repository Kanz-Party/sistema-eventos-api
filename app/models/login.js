const sql = require("./db.js");
const bcrypt = require('bcrypt');
const session = require('express-session');
const Usuario = require("./usuario.model.js");
const jwt = require('jsonwebtoken');
require('dotenv').config();



exports.login = (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    Usuario.findByEmail(email, (err, data) => {
        console.log('usuario logado', data[0]);
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Usuário não encontrado.`
                });
            } else {
                res.status(500).send({
                    message: "Erro ao tentar encontrar o usuário com o e-mail " + email
                });
            }
        } else {
            if (bcrypt.compareSync(senha, data[0].usuario_senha)) {
                const token = jwt.sign({ id: data[0].usuario_id }, process.env.JWT_SECRET, {
                    expiresIn: '1h' // 5 minutos
                });
                res.status(200).send({ auth: true, token: token });
            } else {
                res.status(401).send({ auth: false, token: null });
            }
        }
    });
};