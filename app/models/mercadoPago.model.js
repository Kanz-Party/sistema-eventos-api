const sql = require("./db.js");
const moment = require('moment');
const MercadoPagoConfig = require('mercadopago').MercadoPagoConfig;
const Preference = require('mercadopago').Preference;
const Payment = require('mercadopago').Payment;
const QrCode = require("./qrcode.model.js");
const { verificarSessao } = require("../middlewares/Auth.js");


const accessToken = 'APP_USR-4998860730644430-011016-9ef57c284e2b4873242bd5794e46f4bd-511688906';
const client = new MercadoPagoConfig({ accessToken });
const notificationUrl = 'https://kanzparty.com.br/api/mercadoPago/receive'
const statusPagamento = {
    pending: 0,
    approved: 1,
    authorized: 0,
    in_process: 0,
    in_mediation: 0,
    rejected: 0, // 0 pq ele pode ser rejeitado e tentar denovo, pior dos casos ele vai expirar
    cancelled: -1,
    refunded: -1,
    charged_back: -1,
}

// Constructor                  
const MercadoPago = function (empresa_id) {
};

function getUsuario(usuario_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT 
            usuario_id,
            usuario_nome,
            usuario_cpf,
            usuario_email,
            usuario_telefone,
            usuario_endereco,
            usuario_numero,
            usuario_cep
            FROM usuarios WHERE usuario_id = ?`, [usuario_id], (err, res) => {
            if (err) {
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res[0]);
                return;
            }
            reject({ kind: "not_found" });
        });
    });
}

function insertPagamento(pagamento) {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO pagamentos SET ? ON DUPLICATE KEY UPDATE ?`;

        sql.query(query, [pagamento, pagamento], (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            let id = res.insertId === 0 ? pagamento.pagamento_id : res.insertId;
            resolve({ ...pagamento, pagamento_id: id });
        });
    });
}

function getPagamentoByCarrinhoAndUsuario(carrinho_id, usuario_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT pagamento_preference_id, pagamento_id FROM pagamentos WHERE carrinho_id = ? AND usuario_id = ? ORDER BY pagamento_id DESC LIMIT 1`, [carrinho_id, usuario_id], (err, res) => {
            if (err) {
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res[0]);
                return;
            }
            resolve(false);
        });
    });
}

function updatePreferenceToExpire(preference_id) {
    return new Promise(async (resolve, reject) => {
        const preference = new Preference(client);
        let newExpirationDate = moment()

        let preferenceBody = await preference.get({preferenceId: preference_id})
        if(!preferenceBody.id) {
            reject({ kind: "not_found" });
        }
        // fazer a preferencia expirar 
        preferenceBody.expiration_date_to = newExpirationDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        preferenceBody.date_of_expiration = newExpirationDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        delete preferenceBody.id;
        preference.update({
            id: preference_id,
            updatePreferenceRequest: preferenceBody
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });

        sql.query(`UPDATE pagamentos SET pagamento_expiracao = ? WHERE pagamento_preference_id = ?`, [newExpirationDate.format('YYYY-MM-DD HH:mm:ss'), preference_id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            resolve(res);
        });
    });

}

MercadoPago.createPayment = async (body, result) => {
    const dateFrom = moment();
    const expirationDate = moment().add(15, 'minutes');

    let preferenceBody = {}; // Initialize preferenceBody here to scope it outside try-catch
    let response = {}; // Initialize response here for broader scope

    try {

        const ingressos = body.ingressos;
        console.log("pegando usuario", body.usuario_id)
        const usuario = await getUsuario(body.usuario_id);
        console.log("ingressos", ingressos)
        console.log("usuario", usuario)

        preferenceBody = {
            items: ingressos.map(ingresso => {
                return {
                    id: ingresso.ingresso_id,
                    title: ingresso.ingresso_descricao,
                    currency_id: 'BRL',
                    description: ingresso.lote_descricao,
                    category_id: 'art',
                    quantity: ingresso.lote_quantidade,
                    unit_price: Number.parseFloat(ingresso.lote_preco)
                }
            }),
            payer: {
                name: usuario.usuario_nome,
                surname: '',
                email: usuario.usuario_email,
                phone: {
                    area_code: usuario.usuario_telefone,
                    number: usuario.usuario_telefone
                },
                identification: {
                    type: 'CPF',
                    number: usuario.usuario_cpf
                },
                address: {
                    street_name: usuario.usuario_endereco,
                    street_number: usuario.usuario_numero,
                    zip_code: usuario.usuario_cep
                }
            },
            payment_methods: {
                excluded_payment_methods: [
                    { id: "bolbradesco" },
                    { id: "pec" }
                ],
                excluded_payment_types: [
                    { id: "credit_card" },
                    { id: "debit_card" }
                ],
                installments: 1
            },
            notification_url: `${notificationUrl}/${body.carrinho_id}/${usuario.usuario_id}?source_news=webhooks`,
            statement_descriptor: 'Kanz Party',
            expires: true,
            expiration_date_from: dateFrom.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            expiration_date_to: expirationDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            date_of_expiration: expirationDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        };
        console.log("preferenceBody", preferenceBody)

        const preference = new Preference(client);
        const pagamentoExistente = await getPagamentoByCarrinhoAndUsuario(body.carrinho_id, usuario.usuario_id);

        try {
            if (pagamentoExistente) {
                response = await preference.update({
                    id: pagamentoExistente.pagamento_preference_id,
                    updatePreferenceRequest: preferenceBody
                });
            } else {
                response = await preference.create({
                    body: preferenceBody
                });
            }
        } catch (error) {
            console.error("Error in createPayment or Update:", error);
            throw new Error("Erro ao criar ou atualizar a preferência de pagamento no MercadoPago");
        }

        if (!response.init_point || !response.id) {
            throw new Error("Erro ao criar ou atualizar a preferência de pagamento no MercadoPago");
        }

        const pagamento = {
            pagamento_id: pagamentoExistente.pagamento_id ? pagamentoExistente.pagamento_id : null,
            carrinho_id: body.carrinho_id,
            usuario_id: body.usuario_id,
            pagamento_status: 0,
            pagamento_checkout_url: response.init_point,
            pagamento_preference_id: response.id,
            pagamento_expiracao: expirationDate.format('YYYY-MM-DD HH:mm:ss')
        };

        const pagamentoResponse = await insertPagamento(pagamento);

        if (!pagamentoResponse.pagamento_id) {
            throw new Error("Erro ao inserir pagamento");
        } else {
            response = {
                ...response,
                carrinho_hash: body.carrinho_hash,
                pagamento: {
                    pagamento_id: pagamentoResponse.pagamento_id,
                    pagamento_expiracao: pagamentoResponse.pagamento_expiracao,
                    pagamento_checkout_url: pagamentoResponse.pagamento_checkout_url,
                    pagamento_preference_id: pagamentoResponse.pagamento_preference_id
                }
            };
            result(null, response);
        }
    } catch (error) {
        console.error("Error in createPayment:", error);
        result({ kind: "error", error: error.message }, null);
    }
};

function getExistantQrCodes(carrinho_id, usuario_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT qrcode_id FROM qrcodes WHERE carrinho_id = ? AND usuario_id = ?`, [carrinho_id, usuario_id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res);
                return;
            } else {
                resolve([]);
            }
            reject({ kind: "not_found" });
        });
    });
}

const cancelarPagamentosPendentesDoUsuario = (preferences_ids) => {
    return new Promise((resolve, reject) => {
        sql.query(`UPDATE pagamentos SET pagamento_status = -1, pagamento_expiracao = NOW() WHERE pagamento_preference_id IN (?)`, [preferences_ids], (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            resolve(res);
        });
    });
};

MercadoPago.removerPagamentosPendentesDoUsuario = (usuario_id, dateToExpire) => {
    return new Promise((resolve, reject) => {
        sql.query("SELECT pagamento_preference_id FROM pagamentos WHERE usuario_id = ? AND pagamento_status = 0", [usuario_id], async (err, res) => {
            if (err) {
                reject(err);
                return;
            }
            let preferences_ids = [];
            if (res.length) {
                for(pagamento of res) {
                    const preference = new Preference(client);
                    try{
                        const preferenceRes = await preference.get({preferenceId: pagamento.pagamento_preference_id})
                        if(preferenceRes.id) {
                            await preference.update({
                                id: pagamento.pagamento_preference_id,
                                updatePreferenceRequest: {
                                    expires: true,
                                    expiration_date_from: dateToExpire.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                                    expiration_date_to: dateToExpire.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                                }
                            })
                        }
                    } catch (error) {
                        console.log("error aqui: ", error);
                    }
                    preferences_ids.push(pagamento.pagamento_preference_id);
                }
                const resCancelar = cancelarPagamentosPendentesDoUsuario(preferences_ids);
                resolve(resCancelar);
            } else {
                resolve({ kind: "not_found" });
            }
        });
    });
};



MercadoPago.receivePayment = async (body, result) => {
    if (!body || !body.data || !body.data.id || !body.carrinho_id || !body.usuario_id) {    
        result({ message: "id do pagamento não informado" }, null);
        return;
    }

    console.log("body", body)

    const payment = new Payment(client);
    let pagamentoMercadoPago = {};
    try {
        pagamentoMercadoPago = await payment.get({
            id: body.data.id,
        });
        if (!pagamentoMercadoPago) {
            result({ message: "pagamento não encontrado no mercado pago" }, null);
            return;
        }
    } catch (error) {
        console.log(error);
        result({ message: "erro ao buscar pagamento", error: error }, null);
        return;
    }

    console.log("pagamentoMercadoPago", pagamentoMercadoPago)

    const pagamentoExistente = await getPagamentoByCarrinhoAndUsuario(body.carrinho_id, body.usuario_id);
    console.log("pagamentoExistente", pagamentoExistente)
    if (!pagamentoExistente) {
        result({ message: "pagamento não encontrado" }, null);
        return;
    }

    
    const newPagamento = {
        pagamento_id: pagamentoExistente.pagamento_id,
        pagamento_status: statusPagamento[pagamentoMercadoPago.status],
        pagamento_mercadopago_id: pagamentoMercadoPago.id,
    }

    console.log("newPagamento", newPagamento)
    
    if(newPagamento.pagamento_status === 1) {
        //atualizar preferencia para expirar
        updatePreferenceToExpire(pagamentoExistente.pagamento_preference_id);
        
        //gerar qrcodes
        let qrCodes = [];
        try {
            qrCodes = await getExistantQrCodes(body.carrinho_id, body.usuario_id);
        } catch (error) {
            result({ kind: "erro ao buscar qrcodes" }, null);
            return;
        }
        if(qrCodes.length) {
            result(null, qrCodes);
            return;
        } else {
            //criar qrcodes e enviar para o email etc
            QrCode.create(body, (err, res) => {
                if (err) {
                    result(err, null);
                    return;
                }
                result(null, res);
            });
        }
    }

    const pagamentoResponse = await insertPagamento(newPagamento);
    if (!pagamentoResponse.pagamento_id) {
        result({ kind: "erro ao inserir pagamento" }, null);
        return;
    }    
};


module.exports = MercadoPago;