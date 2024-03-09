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

    let usuario_id = false;

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            usuario_id = false;
        } else {
            usuario_id = decodedToken.id;
        }
    })

    req.body.usuario_id = usuario_id;

    Carrinho.create(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                err: err.err || "ERRO_INTERNO",
                message: err.message || "Ocorreu um erro ao criar o carrinho."
            });
        else res.send(data);
    });
};

exports.getMeusCarrinhos = (req, res) => {
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

        // If verification is successful, extract usuario_id from decodedToken
        const usuario_id = decodedToken.id;

        if (!usuario_id) {
            // If usuario_id is not found after decoding, it means something went wrong with token decoding
            return res.status(401).send({
                err: 'USUARIO_NAO_AUTORIZADO',
                message: "Usuário não autorizado."
            });
        }

        // Adjust the request object or create a new object to pass usuario_id to Carrinho.getMeusIngressos
        // This approach depends on how Carrinho.getMeusIngressos expects to receive usuario_id
        // Assuming it expects usuario_id as part of the request, for example:
        req.usuario_id = usuario_id;

        // Now call Carrinho.getMeusIngressos with the modified request
        Carrinho.getMeusCarrinhos(req, (err, data) => {

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

exports.getMeusQrcodes = (req, res) => {
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

        // If verification is successful, extract usuario_id from decodedToken
        const usuario_id = decodedToken.id;

        if (!usuario_id) {
            // If usuario_id is not found after decoding, it means something went wrong with token decoding
            return res.status(401).send({
                err: 'USUARIO_NAO_AUTORIZADO',
                message: "Usuário não autorizado."
            });
        }

        // Adjust the request object or create a new object to pass usuario_id to Carrinho.getMeusQrcodes
        // This approach depends on how Carrinho.getMeusQrcodes expects to receive usuario_id
        // Assuming it expects usuario_id as part of the request, for example:
        req.usuario_id = usuario_id;
        req.carrinho_id = req.params.carrinho_id;

        // Now call Carrinho.getMeusQrcodes with the modified request
        Carrinho.getMeusQrcodes(req, (err, data) => {

            if (err) {
                return res.status(500).send({
                    err: err.err || "ERRO_INTERNO",
                    message: err.message || "Ocorreu um erro ao obter os qrcodes."
                });
            } else {
                res.send(data);
            }
        });
    });
}


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