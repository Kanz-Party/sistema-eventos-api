const Ingresso = require("../models/ingresso.model.js");

// Create and Save a new Ingresso
// exports.create = (req, res) => {
//   // Validate request
//   if (!req.body) {
//     res.status(400).send({
//       message: "Content can not be empty!"
//     });
//   }

//   // Create an Ingresso
//   const ingresso = new Ingresso({
//     descricao: req.body.descricao,
//     telefone: req.body.telefone,
//     email: req.body.email,
//     senha: req.body.senha
//   });

//   // Save Ingresso in the database
//   Ingresso.create(ingresso, (err, data) => {
//     if (err)
//       res.status(500).send({
//         message:
//           err.message || "Some error occurred while creating the Ingresso."
//       });
//     else res.send(data);
//   });
// };

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

// Find a single Ingresso by Id
// exports.findOne = (req, res) => {
//   Ingresso.findById(req.params.id, (err, data) => {
//     if (err) {
//       if (err.kind === "not_found") {
//         res.status(404).send({
//           message: `Not found Ingresso with id ${req.params.id}.`
//         });
//       } else {
//         res.status(500).send({
//           message: "Error retrieving Ingresso with id " + req.params.id
//         });
//       }
//     } else res.send(data);
//   });
// };

// // Update an Ingresso identified by the id in the request
// exports.update = (req, res) => {
//   // Validate Request
//   if (!req.body) {
//     res.status(400).send({
//       message: "Content can not be empty!"
//     });
//   }

//   Ingresso.updateById(
//     req.params.id,
//     new Ingresso(req.body),
//     (err, data) => {
//       if (err) {
//         if (err.kind === "not_found") {
//           res.status(404).send({
//             message: `Not found Ingresso with id ${req.params.id}.`
//           });
//         } else {
//           res.status(500).send({
//             message: "Error updating Ingresso with id " + req.params.id
//           });
//         }
//       } else res.send(data);
//     }
//   );
// };

// // Delete an Ingresso with the specified id in the request
// exports.delete = (req, res) => {
//   Ingresso.remove(req.params.id, (err, data) => {
//     if (err) {
//       if (err.kind === "not_found") {
//         res.status(404).send({
//           message: `Not found Ingresso with id ${req.params.id}.`
//         });
//       } else {
//         res.status(500).send({
//           message: "Could not delete Ingresso with id " + req.params.id
//         });
//       }
//     } else res.send({ message: `Ingresso was deleted successfully!` });
//   });
// };

// // Delete all Ingressos from the database.
// exports.deleteAll = (req, res) => {
//   Ingresso.removeAll((err, data) => {
//     if (err)
//       res.status(500).send({
//         message:
//           err.message || "Some error occurred while removing all ingressos."
//       });
//     else res.send({ message: `All Ingressos were deleted successfully!` });
//   });
// };
