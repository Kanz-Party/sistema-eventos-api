const Carrinho = require("../models/carrinho.model.js");

exports.create = (req, res) => {
    if (!req.body.carrinho_lotes) {
        res.status(400).send({
            err: 'CARRINHO_VAZIO',
            message: "O carrinho não pode estar vazio."
        });
        return;
    }

    Carrinho.create(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                err: err.err || "ERRO_INTERNO",
                message: err.message || "Ocorreu um erro ao criar o carrinho."
            });
        else res.send(data);
    });
};