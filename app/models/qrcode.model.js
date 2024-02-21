const sql = require("./db.js");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Pdf = require("./pdf.model.js");
const Mailer = require("./mailer.model.js");
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

function generateRandomDigits(length) {
    let result = '';
    while (result.length < length) {
        // Generate a random integer in the range [0, 9999] to ensure we get chunks of up to 4 digits
        const randomInt = crypto.randomInt(0, 10000);
        // Pad the random integer to ensure it has 4 digits, then concatenate
        result += randomInt.toString().padStart(4, '0');
    }
    // Trim the result to the exact length needed, in case the last addition exceeds the desired length
    return result.substring(0, length);
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
                qrcode_hash: generateRandomDigits(16),
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
        await Mailer.enviarIngressos(qrCodes);
    } catch (error) {
        result(error, null);
        return;
    }

    result(null, qrCodes);
};


module.exports = QrCode;
