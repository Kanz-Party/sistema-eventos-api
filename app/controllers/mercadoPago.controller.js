const MercadoPago = require("../models/mercadoPago.model.js");


// Retrieve all MercadoPagos from the database.
exports.createPayment = (req, res) => {
    
  MercadoPago.createPayment(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mercadopagos."
      });
    else res.send(data);
  });

};