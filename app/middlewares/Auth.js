// verificarToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
 
    return res.status(403).send({ message: "Nenhum token fornecido!" });

};


const verificarSessao = (req, res, next) => {
 
      return res.status(200).send({ message: "Autorizado!" });
    

  
};

module.exports = { verificarToken, verificarSessao };
