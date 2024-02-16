const sql = require("./db.js");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Pdf = require("./pdf.model.js");
const ingressos_email = require("../assets/emails/ingressos.js");

// Constructor
const QrCode = function(qrcode) {

};

function getIngressos(carrinho_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT
            c.carrinho_id,
            u.usuario_id,
            i.ingresso_id,
            i.ingresso_descricao,
            l.lote_id,
            l.lote_descricao,
            cl.lote_quantidade,
            u.usuario_email,
            u.usuario_nome,
            FORMAT(ROUND(cl.lote_preco / 100, 2), 2) as lote_preco 
            FROM carrinhos c 
            LEFT JOIN pagamentos p ON c.carrinho_id = p.carrinho_id
            LEFT JOIN usuarios u ON p.usuario_id = u.usuario_id
            LEFT JOIN carrinhos_lotes cl ON c.carrinho_id = cl.carrinho_id
            LEFT JOIN lotes l ON cl.lote_id = l.lote_id
            LEFT JOIN ingressos i ON l.ingresso_id = i.ingresso_id
            WHERE c.carrinho_id = ?`, [carrinho_id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            if (res.length) {
                resolve(res);
                return;
            }
            reject({ error: "not_found", message: "Ingressos não encontrados."});
        });
    });
}

function insertQrCode(qrcode) {
    return new Promise((resolve, reject) => {
        sql.query("INSERT INTO qrcodes SET ?", qrcode, (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            resolve({ qrcode_id: res.insertId, ...qrcode });
        });
    });
}

function sendEmails(qrcodes) {
    return new Promise(async (resolve, reject) => {
        await Pdf.generate(qrcodes);

        const carrinho_id = qrcodes[0].carrinho_id;
        const usuario_nome = qrcodes[0].usuario_nome;
        const usuario_email = qrcodes[0].usuario_email;

        let transporter = nodemailer.createTransport({
            host: 'smtp-vip.kinghost.net.',
            auth: {
                user: 'naoresponda@kanzparty.com.br',
                pass: 'W83qp5eQ40@'
            }
        });

        let mailOptions = {
            from: 'naoresponda@kanzparty.com.br',
            to: "test-dd4464@test.mailgenius.com",
            subject: `Olá, ${usuario_nome}! Seus ingressos estão prontos!`,
            html: ingressos_email.generate(qrcodes),
            attachments: qrcodes.map(qrCode => ({
                filename: `${qrCode.qrcode_id}.pdf`,
                path: `app/assets/ingressos/${carrinho_id}/${qrCode.qrcode_id}.pdf`,
                contentType: 'application/pdf'
            }))
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response);
            }
        });
    });
}

QrCode.create = async (body, result) => {
    let ingressos = [];
    try {
        ingressos = await getIngressos(body.carrinho_id);
    } catch (error) {
        result(error, null);
        return;
    }
    let qrCodes = [];

    for(const ingresso of ingressos) {
        for(let i = 0; i < Number.parseInt(ingresso.lote_quantidade); i++) {
            const qrCode = {
                carrinho_id: ingresso.carrinho_id,
                usuario_id: ingresso.usuario_id,
                lote_id: ingresso.lote_id,
                qrcode_ativo: 1,
            };

            try {
                let newQrCode = await insertQrCode(qrCode);
                qrCodes.push({
                    ...newQrCode,
                    ingresso_descricao: ingresso.ingresso_descricao,
                    lote_descricao: ingresso.lote_descricao,
                    usuario_email: ingresso.usuario_email,
                    usuario_nome: ingresso.usuario_nome,
                    lote_preco: ingresso.lote_preco,
                    carrinho_id: ingresso.carrinho_id
                });
            } catch (error) {
                result(error, null);
                return;
            }
        }
    }

    try {
        await sendEmails(qrCodes);
    } catch (error) {
        result(error, null);
        return;
    }

    result(null, qrCodes);
};


module.exports = QrCode;
