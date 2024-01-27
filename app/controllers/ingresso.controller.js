const Ingresso = require("../models/ingresso.model.js");

// Retrieve all Ingressos from the database.
exports.findAll = (req, res) => {

  Ingresso.getAll((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving ingressos."
      });
    else res.send(data);
  });

};