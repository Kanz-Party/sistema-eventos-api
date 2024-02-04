// verificarToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send({ message: "Nenhum token fornecido!" });
  }
  token = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Não autorizado!" });
    }
    req.usuarioId = decoded.id;
    next();
  });
};


const verificarSessao = (req, res, next) => {
  console.log("token2222: ", token);
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send({ message: "Nenhum token fornecido!" });
  }
  token = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Não autorizado!" });
    } else {
      return res.status(200).send({ message: "Autorizado!" });
    }

  });
};

module.exports = { verificarToken, verificarSessao };
