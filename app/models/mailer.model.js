const sql = require("./db.js");
const nodemailer = require('nodemailer');
const Pdf = require("./pdf.model.js");
const ingressos_email = require("../assets/emails/ingressos.js");

// Constructor
const Mailer = function(Mailer) {
};

function sendEmails(mailOptions) {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp-vip.kinghost.net.',
            auth: {
                user: 'naoresponda@kanzparty.com.br',
                pass: 'W83qp5eQ40@'
            }
        });
    
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

Mailer.enviarIngressos = (qrcodes, carrinho_id, usuario_nome, usuario_email) => {
    return new Promise(async (resolve, reject) => {
        await Pdf.generate(qrcodes);

        let mailOptions = {
            from: 'naoresponda@kanzparty.com.br',
            to: usuario_email,
            subject: `Olá, ${usuario_nome}! Seus ingressos estão prontos!`,
            html: ingressos_email.generate(qrcodes),
            attachments: qrcodes.map(qrCode => ({
                filename: `${qrCode.qrcode_hash}.pdf`,
                path: `app/assets/ingressos/${carrinho_id}/${qrCode.qrcode_hash}.pdf`,
                contentType: 'application/pdf'
            }))
        };

        sendEmails(mailOptions)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = Mailer;
