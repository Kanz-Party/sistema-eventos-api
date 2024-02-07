const sql = require("./db.js");
const crypto = require('crypto');

// Constructor
const QrCode = function(qrcode) {

};

function getIngressos(carrinho_id) {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT
            carrinho_id,
            usuario_id,
            ingresso_id,
            ingresso_descricao,
            lote_id,
            lote_descricao,
            cl.lote_quantidade,
            FORMAT(ROUND(cl.lote_preco / 100, 2), 2) as lote_preco 
            FROM carrinhos c 
            JOIN pagamentos p USING (carrinho_id)
            JOIN usuarios u USING (usuario_id)
            JOIN carrinhos_lotes cl USING (carrinho_id)
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

function insertQrCode(qrcode) {
    return new Promise((resolve, reject) => {
        sql.query("INSERT INTO qrcodes SET ?", qrcode, (err, res) => {
            if (err) {
                console.log("error: ", err);
                reject(err);
                return;
            }
            resolve({ id: res.insertId, ...qrcode });
        });
    });
}


QrCode.create = async (body, result) => {
    const ingressos = await getIngressos(body.carrinho_id);

    for(const ingresso of ingressos) {
        for(let i = 0; i < Number.parseInt(ingresso.lote_quantidade); i++) {
            const sha256 = crypto.createHash('sha256'); 
            const qrCode = {
                lote_id: ingresso.lote_id,
                usuario_id: ingresso.usuario_id,
                qrcode_hash: sha256.update(`${body.carrinho_id}-${ingresso.lote_id}-${ingresso.lote_id}-${i}`).digest('hex')
            };

            try {
                await insertQrCode(qrCode);
            } catch (error) {
                result(error, null);
                return;
            }
        }
    }
};


module.exports = QrCode;
