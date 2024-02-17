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
    req.usuario_id = decoded.id;
    next();
  });
};


const verificarToken = (req, res, next) => {
  console.log('aaa')
  let token = req.headers["authorization"];
  if (!token || !token.startsWith('Bearer ')) {
    return res.json({ estaLogado: false });
  }
  token = token.slice(7, token.length); // Remove 'Bearer ' do token

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.json({ estaLogado: false });
    } else {
      const usuario_id = decodedToken.id;
      return res.json({
        estaLogado: true,
        usuario: {
          usuario_id: usuario_id,
          nome: decodedToken.nome,
          email: decodedToken.email
        }
      });
    }
  })
}

module.exports = verificarSessao;
module.exports = verificarToken;
