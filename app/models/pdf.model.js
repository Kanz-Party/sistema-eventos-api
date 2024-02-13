const sql = require("./db.js");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const QRCode = require('qrcode');
const { callbackPromise } = require("nodemailer/lib/shared/index.js");

const Pdf = function(pdf) {
};

// {
//     "qrcode_id": 14681,
//     "carrinho_id": 1542,
//     "usuario_id": 4,
//     "lote_id": 2,
//     "qrcode_ativo": 1,
//     "ingresso_descricao": "Pista (Feminino)",
//     "lote_descricao": "Lote Promocional",
//     "usuario_email": "victor.tramontina0609@gmail.com",
//     "usuario_nome": "Victor Tramontina",
//     "lote_preco": "25.00"
// }

Pdf.generate = (ingressos, result) => {
    // Create a new PDF document
    let doc = new PDFDocument;

    const dir = `app/assets/ingressos/`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    // Pipe its output to a file
    doc.pipe(fs.createWriteStream(`${dir}${ingressos[0].carrinho_id}.pdf`));

    // Function to generate a page for an ingresso
    const generatePage = (ingresso, isLast, callback) => {
        // Generate QR code
        QRCode.toDataURL(ingresso.qrcode_id.toString(), function (err, url) {
            if (err) {
                console.log(err);
                return callback(err);
            }
    
            // titulo
            doc.fontSize(24)
                .text(`Ingresso #${ingresso.qrcode_id.toString()}`, { align: 'center' })
                .moveDown(2); // Adjust the spacing
    
            // QR code
            doc.image(url, {
                fit: [200, 200],
                align: 'center'
            });
    
            // texto 
            doc.fontSize(18)
                .text('Apresente este código QR na entrada!', { align: 'center' })
                .moveDown(); // Adjust the spacing
    
            // Add the ingresso text
            doc.fontSize(14)
                .text(`Ingresso: ${ingresso.ingresso_descricao} - ${ingresso.lote_descricao}`, { align: 'center' })
                .moveDown(); // Adjust the spacing
    
            // Add a footer
            doc.fontSize(12)
                .text('Te esperamos na Kanz Party!', { align: 'center' });
    
            // Add a page break if this is not the last ingresso
            if (!isLast) {
                doc.addPage();
            }
    
            callback(null);
        });
    };

    // Generate a page for each ingresso
    // This is done using a recursive function to ensure that the pages are generated in the correct order
    let i = 0;
    const next = () => {
        if (i < ingressos.length) {
            generatePage(ingressos[i], i === ingressos.length - 1, (err) => {
                if (err) {
                    result(err, null);
                } else {
                    i++;
                    next();
                }
            });
        } else {
            // Finalize the PDF and end the stream
            doc.end();

            doc.on('finish', function() {
                result(null, true);
            });

            doc.on('error', function(err) {
                result(err, null);
            });
        }
    };
    next();
};

module.exports = Pdf;