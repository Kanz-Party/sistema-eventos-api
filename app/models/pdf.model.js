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
                const pdfWidth = doc.page.width;
                const pdfHeight = doc.page.height;

                // Add logo image at the top of the page
                const logoSize = 150;
                const logoPosX = (pdfWidth - logoSize) / 2;
                doc.image('app/assets/images/semfundo.png', {
                    fit: [logoSize, logoSize],
                    align: 'center',
                    x: logoPosX,
                })
                .moveDown(4);

                doc.fontSize(20)
                    .text(`Ingresso #${ingresso.qrcode_id.toString()}`, { align: 'center' })
                    
                const qrCodeSize = 300; // The size of the QR code
                const qrCodePosX = (pdfWidth - qrCodeSize) / 2; // Calculate the x position of the QR code
                doc.image(url, {
                    fit: [qrCodeSize, qrCodeSize],
                    align: 'center',
                    x: qrCodePosX, // Set the x position of the QR code
                })
                .moveDown();

                doc.fontSize(18)
                .text('Apresente este código QR na entrada.', { align: 'center' })
                .moveDown();    

                doc.fontSize(16)
                    .text(`Ingresso: ${ingresso.ingresso_descricao} - ${ingresso.lote_descricao}`, { align: 'center' })
                    .moveDown();

                // Add date and time of the party
                doc.fontSize(16)
                    .text(`Data: 09/03 - Horário: 23:30`, { align: 'center' })
                    .moveDown();

                const textPosY = pdfHeight - 100;
                doc.fontSize(20)
                    .fillColor(`#ce9d3d`) // Change the color to red
                    .text('Te esperamos na Kanz Party!', { align: 'center' }, textPosY);

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
        for (const ingresso of ingressos) {
            const pdfPath = await generatePdf(ingresso);
            pdfPaths.push(pdfPath);
        }
        return pdfPaths;
    } catch (error) {
        throw error;
    }
};

module.exports = Pdf;
