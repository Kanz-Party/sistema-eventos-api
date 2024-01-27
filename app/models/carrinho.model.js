const sql = require("./db.js");
const moment = require('moment');
const crypto = require('crypto');

const carrinho_tempo_expiracao = 15 * 60 * 1000; // 15 minutos
const intervalo_checar_status = 5 * 60 * 1000; // 5 minutos

// Constructor
const Carrinho = function (carrinho) {
    this.carrinho_id = carrinho.carrinho_id;
    this.carrinho_hash = carrinho.carrinho_hash;
    this.carrinho_expiracao = carrinho.carrinho_expiracao;
    this.carrinho_lotes = carrinho.carrinho_lotes;
};

Carrinho.findByHash = async (carrinho_hash, result) => {
    try {
        const carrinho = await getCarrinhoByHash(carrinho_hash);

        if (!carrinho) {
            throw new Error(`CARRINHO_NAO_ENCONTRADO: ${carrinho_hash}`);
        }
        if(moment(carrinho.carrinho_expiracao).isBefore(moment())) {
            throw new Error(`CARRINHO_EXPIRADO: ${carrinho_hash}`);
        };

        const carrinhoLotes = await getCarrinhoLotes(carrinho.carrinho_id);

        result(null, { ...carrinho, carrinho_lotes: carrinhoLotes });
    } catch (err) {
        console.error("error: ", err);
        result(err, null);
    }
}

const getCarrinhoByHash = (carrinho_hash) => {
    return new Promise((resolve, reject) => {
        sql.query("SELECT * FROM carrinhos WHERE carrinho_hash = ? AND carrinho_ativo = 1", [carrinho_hash], (err, res) => {
            if (err) return reject(err);
            resolve(res[0]);
        });
    });
};

const getCarrinhoLotes = (carrinho_id) => {
    return new Promise((resolve, reject) => {
        sql.query("SELECT ingresso_id, ingresso_descricao, lote_id, lote_descricao, cl.lote_preco, cl.lote_quantidade FROM carrinhos_lotes cl JOIN lotes USING(lote_id) JOIN ingressos USING(ingresso_id) WHERE cl.carrinho_id = ?", [carrinho_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

Carrinho.create = async (newCarrinho, result) => {
    try {
        const { carrinho_lotes } = newCarrinho;
        delete newCarrinho.carrinho_lotes;
        
        newCarrinho.carrinho_expiracao = moment().add(carrinho_tempo_expiracao, 'ms').format('YYYY-MM-DD HH:mm:ss');
        newCarrinho.carrinho_hash = crypto.randomBytes(20).toString('hex');

        const carrinho_id = await insertCarrinho(newCarrinho);

        // apagar carrinho após 15 minutos
        setTimeout(() => apagarCarinho(carrinho_id), carrinho_tempo_expiracao)

        const lotes_db = await getLotesDb(carrinho_lotes);

        for (const carrinho_lote of carrinho_lotes) {
            const data_atual = moment().format('YYYY-MM-DD HH:mm:ss');
            const lote_db = lotes_db.find(l => l.lote_id === carrinho_lote.lote_id);
            
            if (!lote_db || lote_db.lote_quantidade < carrinho_lote.lote_quantidade) {
                throw new Error(`QUANTIDADE_INVALIDA: ${carrinho_lote.lote_id}`);
            }

            if (lote_db.lote_quantidade_maxima < carrinho_lote.lote_quantidade) {
                throw new Error(`QUANTIDADE_MAXIMA_ULTRAPASSADA: ${carrinho_lote.lote_id}`);
            }

            if (lote_db.lote_data_inicio_venda > data_atual || lote_db.lote_data_fim_venda < data_atual) {
                throw new Error(`DATA_INVALIDA: ${carrinho_lote.lote_id}`);
            }

            await insertCarrinhoLotes(carrinho_id, carrinho_lote, lote_db.lote_preco);
            await updateLoteQuantidade(carrinho_lote);
        }

        result(null, { carrinho_id: carrinho_id, carrinho_hash: newCarrinho.carrinho_hash});
    } catch (err) {
        console.error("error: ", err);
        result(err, null);
    }
};

const apagarCarinho = (carrinho_id) => {
    return new Promise((resolve, reject) => {
        sql.query("UPDATE carrinhos SET carrinho_ativo = 0 WHERE carrinho_id = ?", [carrinho_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
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
