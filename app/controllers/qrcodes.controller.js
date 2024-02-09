const QrCode = require("../models/qrcode.model.js");

// Retrieve all qrcodess from the database.
exports.create = (req, res) => {
    
  QrCode.create(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating payment.",
        error: err
      });
    else res.send(data);
  });

};
