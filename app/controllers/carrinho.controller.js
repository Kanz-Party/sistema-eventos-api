const Carrinho = require("../models/carrinho.model.js");
const jwt = require('jsonwebtoken');


exports.create = (req, res) => {
    if (!req.body.carrinho_lotes) {
        res.status(400).send({
            err: 'CARRINHO_VAZIO',
            message: "O carrinho não pode estar vazio."
        });
        return;
    }

    let token = req.headers["authorization"];

    if (!token || !token.startsWith('Bearer ')) {
        return res.json({ estaLogado: false });
    }

    token = token.slice(7, token.length);

    let usuarioId = false;

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            usuarioId = false;
        } else {
            usuarioId = decodedToken.id;
        }
    })

    req.body.usuarioId = usuarioId;

    Carrinho.create(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                err: err.err || "ERRO_INTERNO",
                message: err.message || "Ocorreu um erro ao criar o carrinho."
            });
        else res.send(data);
    });
};

exports.findByHash = (req, res) => {
    Carrinho.findByHash(req.params.carrinho_hash, (err, data) => {
        if (err)
            res.status(500).send({
                err: err.err || "ERRO_INTERNO",
                message: err.message || "Ocorreu um erro ao criar o carrinho."
            });
        else res.send(data);
    });
};