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

        const [carrinhoLotes, pagamento] = await Promise.all([
            getCarrinhoLotes(carrinho.carrinho_id),
            getPagamento(carrinho.carrinho_id)
        ]);

        result(null, { ...carrinho, carrinho_lotes: carrinhoLotes, pagamento: pagamento });
    } catch (err) {
        console.error("error: ", err);
        result(err, null);
    }
}

const getPagamento = (carrinho_id) => {
    return new Promise((resolve, reject) => {
        sql.query("SELECT * FROM pagamentos WHERE carrinho_id = ?", [carrinho_id], (err, res) => {
            if (err) return reject(err);
            resolve(res[0]);
        });
    });
};

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

Carrinho.getMeusCarrinhos = (req, result) => {
    const usuario_id = req.usuario_id;

    sql.query(`SELECT c.carrinho_id,
            FORMAT(ROUND(SUM(cl.lote_preco * cl.lote_quantidade) / 100, 2), 2) as carrinho_total,
            SUM(cl.lote_quantidade)                                            as carrinho_itens,
            DATE_SUB(c.carrinho_expiracao, INTERVAL 15 MINUTE)                 as carrinho_data_criacao,
            p.pagamento_status
        from carrinhos c
            LEFT JOIN carrinhos_lotes cl ON c.carrinho_id = cl.carrinho_id
            LEFT JOIN lotes l ON l.lote_id = cl.lote_id
            LEFT JOIN pagamentos p on c.carrinho_id = p.carrinho_id
            LEFT JOIN usuarios u on p.usuario_id = u.usuario_id
        WHERE u.usuario_id = ?
        AND p.pagamento_id IS NOT NULL
        AND ((p.pagamento_expiracao > NOW() AND p.pagamento_status = 0) OR p.pagamento_status = 1)
        AND p.pagamento_status = 1
        GROUP BY cl.carrinho_id`
    , [usuario_id], (err, res) => {
        if (err) {
            result(err, null);
            return;
        }
        if(res.length) {
            return result(null, res);
        }
        result(null, []);
    });
};

Carrinho.getMeusQrcodes = (req, result) => {
    const carrinho_id = req.carrinho_id;

    sql.query(`SELECT q.qrcode_hash, l.lote_descricao, i.ingresso_descricao, q.qrcode_ativo, q.qrcode_data_entrada
        FROM qrcodes q
            LEFT JOIN lotes l ON q.lote_id = l.lote_id
            LEFT JOIN ingressos i ON l.ingresso_id = i.ingresso_id
        where q.carrinho_id = ?`
    , [carrinho_id], (err, res) => {
        if (err) {
            result(err, null);
            return;
        }
        if(res.length) {
            return result(null, res);
        }
        result(null, []);
    });
};

const expirarCarrinhosJaPendentesDoUsuario = (usuario_id, dateToExpire) => {
    return new Promise((resolve, reject) => {
        sql.query("UPDATE carrinhos SET carrinho_expiracao = ? WHERE carrinho_id IN (SELECT carrinho_id FROM pagamentos WHERE usuario_id = ? AND pagamento_status = 0)", [dateToExpire.format('YYYY-MM-DD HH:mm:ss'), usuario_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

function getIngressos(carrinho_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT
            c.carrinho_id,
            i.ingresso_id,
            i.ingresso_descricao,
            l.lote_id,
            l.lote_descricao,
            cl.lote_quantidade,
            FORMAT(ROUND(cl.lote_preco / 100, 2), 2) as lote_preco FROM
            carrinhos c 
            JOIN carrinhos_lotes cl on c.carrinho_id = cl.carrinho_id
            JOIN lotes l on cl.lote_id = l.lote_id
            JOIN ingressos i on l.ingresso_id = i.ingresso_id
            WHERE c.carrinho_id = ?`, [carrinho_id], (err, res) => {
            if (err) {
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res);
                return;
            }
            reject({ kind: "Ingressos não encontrados" });
        });
    });
}

Carrinho.create = async (newCarrinho, result) => {
    try {
        if(!newCarrinho.usuario_id) return result({err: 'USUARIO_NAO_INFORMADO', message: 'Usuário não informado'});
        if(!newCarrinho.carrinho_lotes || newCarrinho.carrinho_lotes.length === 0) return result({err: 'LOTES_NAO_INFORMADOS', message: 'Lotes não informados'});

        console.log('Iniciando criação do carrinho com dados:', newCarrinho);
        const { carrinho_lotes } = newCarrinho;
        const usuario_id = newCarrinho.usuario_id;
        console.log('Dados extraídos: carrinho_lotes e usuario_id', carrinho_lotes, usuario_id);

        console.log('Expirando carrinhos já pendentes do usuário...', usuario_id)
        try {   
            const dateToExpire = moment();
            await expirarCarrinhosJaPendentesDoUsuario(usuario_id, dateToExpire);
            await MercadoPago.removerPagamentosPendentesDoUsuario(usuario_id, dateToExpire);
        } catch (error) {
            console.error('Erro ao expirar carrinhos pendentes do usuário:', error);
            result({
                err: 'ERRO_INTERNO',
                message: 'Erro ao expirar carrinhos pendentes do usuário'
            });
        }

        delete newCarrinho.usuario_id;
        delete newCarrinho.carrinho_lotes;
        console.log('Dados de usuário e lotes removidos do newCarrinho', newCarrinho);

        newCarrinho.carrinho_expiracao = moment().add(carrinho_tempo_expiracao, 'ms').format('YYYY-MM-DD HH:mm:ss');
        newCarrinho.carrinho_hash = crypto.randomBytes(20).toString('hex');
        console.log('Definidos carrinho_expiracao e carrinho_hash', newCarrinho.carrinho_expiracao, newCarrinho.carrinho_hash);

        const lotes_db = await getLotesDb(carrinho_lotes);
        console.log('Lotes obtidos do banco de dados:', lotes_db);

        let carrinhos_lotes_insert = [];
        for (const carrinho_lote of carrinho_lotes) {
            console.log('Processando lote:', carrinho_lote);

            const data_atual = moment().format('YYYY-MM-DD HH:mm:ss');
            const lote_db = lotes_db.find(l => l.lote_id === carrinho_lote.lote_id);
            console.log('Dados do lote_db encontrados:', lote_db);

            if (!lote_db || lote_db.lote_quantidade < carrinho_lote.lote_quantidade) {
                console.log(`Quantidade indisponível para o lote ${carrinho_lote.lote_id}`);
                result({
                    err: 'QUANTIDADE_INDISPONIVEL',
                    message: `Quantidade indisponível para o lote ${carrinho_lote.lote_id}`
                });
                return;
            }

            if (lote_db.lote_quantidade_maxima < carrinho_lote.lote_quantidade) {
                console.log(`Quantidade máxima excedida para o lote ${carrinho_lote.lote_id}`);
                result({
                    err: 'QUANTIDADE_MAXIMA_EXCEDIDA',
                    message: `Quantidade máxima excedida para o lote ${carrinho_lote.lote_id}`
                });
                return;
            }

            if (lote_db.lote_data_inicio_venda > data_atual || lote_db.lote_data_fim_venda < data_atual) {
                console.log(`Lote ${carrinho_lote.lote_id} fora da venda`);
                result({
                    err: 'LOTE_FORA_DA_VENDA',
                    message: `Lote ${carrinho_lote.lote_id} fora da venda`
                });
                return;
            }

            carrinhos_lotes_insert.push({
                lote_id: carrinho_lote.lote_id,
                lote_preco: lote_db.lote_preco,
                lote_quantidade: carrinho_lote.lote_quantidade
            });
            console.log('Lote adicionado para inserção:', carrinho_lote.lote_id);
        }

        console.log('Inserindo carrinho...');
        const { carrinho_id, carrinho_hash } = await insertCarrinho(newCarrinho);
        console.log('Carrinho inserido com ID:', carrinho_id);

        console.log('Inserindo lotes no carrinho...');
        await insertCarrinhoLotes(carrinho_id, carrinhos_lotes_insert)
        const ingressos = await getIngressos(carrinho_id);
        console.log('Ingressos obtidos:', ingressos);


        console.log('Criando pagamento no MercadoPago...');
        console.log('carrinho_id:', carrinho_id);
        console.log('usuario_id:', usuario_id);
        MercadoPago.createPayment({ carrinho_id, carrinho_hash, usuario_id, ingressos }, result);    
    } catch (err) {
        console.error("error: ", err);
        result(err, null);
    }
};


const insertCarrinho = (carrinho) => {
    return new Promise((resolve, reject) => {
        sql.query("INSERT INTO carrinhos SET ?", carrinho, (err, res) => {
            if (err) return reject(err);
            resolve({ carrinho_id: res.insertId, ...carrinho });
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

const updateLoteQuantidade = (carrinho_lote) => {
    return new Promise((resolve, reject) => {
        sql.query("UPDATE lotes SET lote_quantidade = lote_quantidade - ? WHERE lote_id = ?", [carrinho_lote.lote_quantidade, carrinho_lote.lote_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });

}

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
        });

        const updates = carrinhos_lotes_insert.map(carrinho_lote =>
            updateLoteQuantidade(carrinho_lote)
        );

        Promise.all(updates)
            .then(() => resolve())
            .catch(err => reject(err));
    });
};

module.exports = Carrinho;
