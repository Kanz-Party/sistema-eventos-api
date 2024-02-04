const sql = require("./db.js");
const moment = require('moment');
const MercadoPagoConfig = require('mercadopago').MercadoPagoConfig;
const Preference = require('mercadopago').Preference;

// Constructor                  
const MercadoPago = function(mercadoPago) {
};

function getIngressos(carrinho_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT
            ingresso_id,
            ingresso_descricao,
            lote_id,
            lote_descricao,
            cl.lote_quantidade,
            FORMAT(ROUND(cl.lote_preco / 100, 2), 2) as lote_preco FROM
            carrinhos c JOIN carrinhos_lotes cl USING (carrinho_id)
            JOIN lotes l USING (lote_id)
            JOIN ingressos i USING (ingresso_id)
            WHERE c.carrinho_id = ${carrinho_id}`, (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res);
                return;
            }
            reject({ kind: "not_found" });
        });
    });
}

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
            FROM usuarios WHERE usuario_id = ${usuario_id}`, (err, res) => {
            if (err) {
                console.log("error: ", err);
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

MercadoPago.createPayment = async (body, result) => {
    const client = new MercadoPagoConfig({ accessToken: 'TEST-4998860730644430-011016-e8e9bec7933d9faa9557b7e19702140a-511688906' });
    const dateFrom = moment();
    const expirationDate = moment().add(15, 'minutes');

    const ingressos = await getIngressos(body.carrinho_id);
    const usuario = await getUsuario(body.usuario_id);

    const preference = new Preference(client);
        preference.create({body: {
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
        // back_urls: {
        //     success: 'https://www.success.com',
        //     failure: 'http://www.failure.com',
        //     pending: 'http://www.pending.com'
        // },
        // auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [
            {
                id: "bolbradesco"
            },
            {
                id: "pec"
            }
          ],
          excluded_payment_types: [
            {
                id: "credit_card"
            },
            {
                id: "debit_card"
            }
          ],
          installments: 1
        },
        // notification_url: 'https://www.your-site.com/ipn',
        // external_reference: '',
        statement_descriptor: 'Kanz Party',
        expires: true,
        expiration_date_from: dateFrom.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        expiration_date_to: expirationDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
    }}).then(response => result(null, response))
    .catch(response => result(response, null));
};


module.exports = MercadoPago;
