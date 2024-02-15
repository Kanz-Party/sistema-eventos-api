const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const Pdf = {};

Pdf.generate = async (ingressos) => {
    const generatePdf = (ingresso) => {
        return new Promise((resolve, reject) => {
            const dir = `app/assets/ingressos/${ingresso.carrinho_id}/`;

            if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const doc = new PDFDocument();
            const filePath = `${dir}${ingresso.qrcode_id}.pdf`;

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            QRCode.toDataURL(ingresso.qrcode_id.toString(), async function (err, url) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                doc.fontSize(24)
                    .text(`Ingresso #${ingresso.qrcode_id.toString()}`, { align: 'center' })
                    .moveDown(2);

                const pdfWidth = doc.page.width;
                const qrCodeSize = 300; // The size of the QR code
                const qrCodePosX = (pdfWidth - qrCodeSize) / 2; // Calculate the position of the QR code

                doc.image(url, {
                    fit: [qrCodeSize, qrCodeSize],
                    align: 'center',
                    valign: 'center',
                    x: qrCodePosX // Set the x position of the QR code
                });

                doc.fontSize(18)
                    .text('Apresente este código QR na entrada!', { align: 'center' })
                    .moveDown();

                doc.fontSize(14)
                    .text(`Ingresso: ${ingresso.ingresso_descricao} - ${ingresso.lote_descricao}`, { align: 'center' })
                    .moveDown();

                doc.fontSize(12)
                    .text('Te esperamos na Kanz Party!', { align: 'center' });

                doc.end();

                writeStream.on('finish', function () {
                    resolve(filePath);
                });

                writeStream.on('error', function (err) {
                    reject(err);
                });
            });
        });
    };

    try {
        const pdfPaths = [];
        let i = 0;
        for (const ingresso of ingressos) {
            i++;
            if(i>2) break;
            const pdfPath = await generatePdf(ingresso);
            pdfPaths.push(pdfPath);
        }
        return pdfPaths;
    } catch (error) {
        throw error;
    }
};

module.exports = Pdf;
