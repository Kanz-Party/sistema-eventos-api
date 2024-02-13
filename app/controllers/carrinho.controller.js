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

exports.getMeusIngressos = (req, res) => {
    let token = req.headers["authorization"];

    if (!token || !token.startsWith('Bearer ')) {
        return res.json({ estaLogado: false });
    }

    token = token.slice(7, token.length);

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            // If JWT verification fails, send an unauthorized response and halt further execution
            return res.status(401).send({
                err: 'USUARIO_NAO_AUTORIZADO',
                message: "Usuário não autorizado."
            });
        }

        // If verification is successful, extract usuarioId from decodedToken
        const usuarioId = decodedToken.id;

        if (!usuarioId) {
            // If usuarioId is not found after decoding, it means something went wrong with token decoding
            return res.status(401).send({
                err: 'USUARIO_NAO_AUTORIZADO',
                message: "Usuário não autorizado."
            });
        }

        // Adjust the request object or create a new object to pass usuarioId to Carrinho.getMeusIngressos
        // This approach depends on how Carrinho.getMeusIngressos expects to receive usuarioId
        // Assuming it expects usuarioId as part of the request, for example:
        req.usuarioId = usuarioId;

        // Now call Carrinho.getMeusIngressos with the modified request
        Carrinho.getMeusIngressos(req, (err, data) => {
            if (err) {
                return res.status(500).send({
                    err: err.err || "ERRO_INTERNO",
                    message: err.message || "Ocorreu um erro ao obter os ingressos."
                });
            } else {
                res.send(data);
            }
        });
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