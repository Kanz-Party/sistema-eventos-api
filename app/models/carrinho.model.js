const sql = require("./db.js");
const moment = require('moment');
const crypto = require('crypto');
const MercadoPago = require("./mercadoPago.model.js");

const carrinho_tempo_expiracao = 15 * 60 * 1000; // 15 minutos

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
            return result({
                err: 'CARRINHO_NAO_ENCONTRADO',
                message: `Carrinho com hash ${carrinho_hash} não encontrado`
            })
        }

        if (moment(carrinho.carrinho_expiracao).isBefore(moment())) {
            return result({
                err: 'CARRINHO_EXPIRADO',
                message: `Carrinho com hash ${carrinho_hash} expirado`
            })
        };

        carrinho.carrinho_expiracao = moment(carrinho.carrinho_expiracao).format('YYYY-MM-DD HH:mm:ss');

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

Carrinho.getMeusIngressos = (req, result) => {
    const usuarioId = req.usuarioId;

    sql.query(`SELECT carrinho_id FROM pagamentos WHERE usuario_id = ?`, [usuarioId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            console.log(res);
            const carrinhos_id = res.map(carrinho => carrinho.carrinho_id);
            console.log(carrinhos_id);
            sql.query(`SELECT
                c.carrinho_id,
                i.ingresso_id,
                i.ingresso_descricao,
                l.lote_id,
                l.lote_descricao,
                cl.lote_quantidade,
                FORMAT(ROUND(cl.lote_preco / 100, 2), 2) AS lote_preco,
                p.*,
                qr.qrcode_id
              FROM
                carrinhos c
                JOIN carrinhos_lotes cl ON c.carrinho_id = cl.carrinho_id
                JOIN lotes l ON l.lote_id = cl.lote_id
                JOIN ingressos i ON i.ingresso_id = l.lote_id
                LEFT JOIN pagamentos p ON p.carrinho_id = c.carrinho_id
                LEFT JOIN qrcodes qr ON qr.carrinho_id = c.carrinho_id
              WHERE c.carrinho_id IN (?) AND (p.pagamento_expiracao  > NOW() OR p.pagamento_status = 1 OR p.pagamento_status = -1)
            
              `, [carrinhos_id], (err, res) => {
                    if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                    }
                    if (res.length) {
                        result(null, res);
                    } else {
                        result({ kind: "not_found" }, null);
                    }
                }
            );
        } else {
            result({ kind: "not_found" }, null);
        }
    });
};


Carrinho.create = async (newCarrinho, result) => {
    try {
        const { carrinho_lotes } = newCarrinho;
        const usuarioId = newCarrinho.usuarioId;
        delete newCarrinho.usuarioId;
        delete newCarrinho.carrinho_lotes;

        newCarrinho.carrinho_expiracao = moment().add(carrinho_tempo_expiracao, 'ms').format('YYYY-MM-DD HH:mm:ss');
        newCarrinho.carrinho_hash = crypto.randomBytes(20).toString('hex');

        const lotes_db = await getLotesDb(carrinho_lotes);

        let carrinhos_lotes_insert = [];
        for (const carrinho_lote of carrinho_lotes) {
            const data_atual = moment().format('YYYY-MM-DD HH:mm:ss');
            const lote_db = lotes_db.find(l => l.lote_id === carrinho_lote.lote_id);

            if (!lote_db || lote_db.lote_quantidade < carrinho_lote.lote_quantidade) {
                result({
                    err: 'QUANTIDADE_INDISPONIVEL',
                    message: `Quantidade indisponível para o lote ${carrinho_lote.lote_id}`
                })
                return;
            }

            if (lote_db.lote_quantidade_maxima < carrinho_lote.lote_quantidade) {
                result({
                    err: 'QUANTIDADE_MAXIMA_EXCEDIDA',
                    message: `Quantidade máxima excedida para o lote ${carrinho_lote.lote_id}`
                })
                return;
            }

            if (lote_db.lote_data_inicio_venda > data_atual || lote_db.lote_data_fim_venda < data_atual) {
                result({
                    err: 'LOTE_FORA_DA_VENDA',
                    message: `Lote ${carrinho_lote.lote_id} fora da venda`
                })
                return;
            }

            carrinhos_lotes_insert.push({
                lote_id: carrinho_lote.lote_id,
                lote_preco: lote_db.lote_preco,
                lote_quantidade: carrinho_lote.lote_quantidade
            });
        }



        const carrinho_id = await insertCarrinho(newCarrinho);
        await insertCarrinhoLotes(carrinho_id, carrinhos_lotes_insert);
        MercadoPago.createPayment({ carrinho_id, usuarioId }, result);

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

const insertCarrinhoLotes = (carrinho_id, carrinhos_lotes_insert) => {
    return new Promise((resolve, reject) => {
        const data = carrinhos_lotes_insert.map(carrinho_lote => [
            carrinho_id,
            carrinho_lote.lote_id,
            carrinho_lote.lote_preco,
            carrinho_lote.lote_quantidade
        ]);

        sql.query("INSERT INTO carrinhos_lotes (carrinho_id, lote_id, lote_preco, lote_quantidade) VALUES ?", [data], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });

        const updates = carrinhos_lotes_insert.map(carrinho_lote =>
            sql.query("UPDATE lotes SET lote_quantidade = lote_quantidade - ? WHERE lote_id = ?", [carrinho_lote.lote_quantidade, carrinho_lote.lote_id])
        );

        Promise.all(updates)
            .then(() => resolve())
            .catch(err => reject(err));
    });
};

module.exports = Carrinho;
