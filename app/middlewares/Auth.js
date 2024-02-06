// verificarToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();



const verificarSessao = (req, res, next) => {
  console.log('aaa')
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send({ message: "Nenhum token fornecido!" });
  }
  token = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
  // Assuming jwt is already declared and initialized correctly elsewhere
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Não autorizado!" });
    }
    req.usuarioId = decoded.id;
    next();
  });
};


const verificarToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token || !token.startsWith('Bearer ')) {
    return res.json({ estaLogado: false });
  }
  token = token.slice(7, token.length); // Remove 'Bearer ' do token

  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) {
      return res.json({ estaLogado: false });
    } else {
      return res.json({ estaLogado: true });
    }
  })
}




module.exports = verificarSessao;
module.exports = verificarToken;
