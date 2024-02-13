const QrCode = require("../models/qrcode.model.js");

exports.create = (req, res) => {
  QrCode.create(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating qrcodes.",
        error: err
      });
    else res.send(data);
  });
};
