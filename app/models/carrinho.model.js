const sql = require("./db.js");
const moment = require('moment');
const crypto = require('crypto');

// Constructor
const Carrinho = function (carrinho) {
    this.carrinho_id = carrinho.carrinho_id;
    this.carrinho_hash = carrinho.carrinho_hash;
    this.carrinho_expiracao = carrinho.carrinho_expiracao;
    this.carrinho_lotes = carrinho.carrinho_lotes;
};

Carrinho.create = async (newCarrinho, result) => {
    try {
        const { carrinho_lotes } = newCarrinho;
        delete newCarrinho.carrinho_lotes;

        newCarrinho.carrinho_expiracao = moment().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        newCarrinho.carrinho_hash = crypto.randomBytes(20).toString('hex');

        const carrinho_id = await insertCarrinho(newCarrinho);

        const lotes_db = await getLotesDb(carrinho_lotes);

        for (const carrinhoLote of carrinho_lotes) {
            const dataAtual = moment().format('YYYY-MM-DD HH:mm:ss');
            const lote_db = lotes_db.find(l => l.lote_id === carrinhoLote.lote_id);

            if (!lote_db || lote_db.lote_quantidade < carrinhoLote.lote_quantidade) {
                throw new Error(`QUANTIDADE_INVALIDA: ${carrinhoLote.lote_id}`);
            }

            if (lote_db.lote_quantidade_maxima < carrinhoLote.lote_quantidade) {
                throw new Error(`QUANTIDADE_MAXIMA_ULTRAPASSADA: ${carrinhoLote.lote_id}`);
            }

            if (lote_db.lote_data_inicio_venda > dataAtual || lote_db.lote_data_fim_venda < dataAtual) {
                throw new Error(`DATA_INVALIDA: ${carrinhoLote.lote_id}`);
            }

            await insertCarrinhoLotes(carrinho_id, carrinhoLote, lote_db.lote_preco);
            await updateLoteQuantidade(carrinhoLote);
        }

        result(null, { carrinho_id: carrinho_id, carrinho_hash: newCarrinho.carrinho_hash});
    } catch (err) {
        console.error("error: ", err);
        result(err, null);
    }
};

const insertCarrinho = (carrinho) => {
    return new Promise((resolve, reject) => {
        sql.query("INSERT INTO carrinhos SET ?", carrinho, (err, res) => {
            if (err) return reject(err);
            resolve(res.insertId);
        });
    });
};

const getLotesDb = (carrinho_lotes) => {
    return new Promise((resolve, reject) => {
        sql.query("SELECT lote_id, lote_quantidade, lote_preco FROM lotes WHERE lote_id IN (?)", [carrinho_lotes.map(lote => lote.lote_id)], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

const insertCarrinhoLotes = (carrinho_id, carrinho_lote, lote_preco) => {
    return new Promise((resolve, reject) => {
        sql.query("INSERT INTO carrinhos_lotes SET ?", {
            carrinho_id: carrinho_id,
            lote_id: carrinho_lote.lote_id,
            lote_preco: lote_preco,
            lote_quantidade: carrinho_lote.lote_quantidade
        }, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

const updateLoteQuantidade = (carrinho_lote) => {
    return new Promise((resolve, reject) => {
        sql.query("UPDATE lotes SET lote_quantidade = lote_quantidade - ? WHERE lote_id = ?", [carrinho_lote.lote_quantidade, carrinho_lote.lote_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

module.exports = Carrinho;
