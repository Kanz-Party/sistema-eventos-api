const MercadoPago = require("../models/mercadoPago.model.js");

// Retrieve all MercadoPagos from the database.
exports.createPayment = (req, res) => {
    
  MercadoPago.createPayment(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating payment.",
        error: err
      });
    else res.send(data);
  });

};

exports.receivePayment = (req, res) => {
    MercadoPago.receivePayment(req.body, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            err.message || "Some error occurred while receiving payment.",
          error: err
        });
      else res.send(data);
    });
};