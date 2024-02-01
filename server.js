const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require('crypto');
const chaveSecreta = crypto.randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Configuração do express-session
app.use(session({
  secret: chaveSecreta,
  resave: false,
  saveUninitialized: true
}));

// Middleware de controle de sessão
const verificaAutenticacao = (req, res, next) => {
  // Obter o token do cabeçalho Authorization
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
      if (err) {
        // Token inválido ou expirado
        return res.status(403).json({ message: "Token inválido ou expirado." });
      }

      // Token válido, anexar usuário ao objeto req e passar para o próximo middleware
      req.usuario = usuario;
      next();
    });
  } else {
    // Sem token no cabeçalho
    res.status(401).json({ message: "Token não fornecido. Você não está autenticado." });
  }
};

// Rota de login
app.post("/login", (req, res) => {
  require("./app/models/login.js").login(req, res);
});

require("./app/routes/mercadoPago.routes.js")(app);
require("./app/routes/ingresso.routes.js")(app);
require("./app/routes/carrinho.routes.js")(app);
// Rotas protegidas que exigem autenticação

require("./app/routes/empresa.routes.js")(app);
require("./app/routes/usuario.routes.js")(app);

// Rota para logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logout bem-sucedido." });
});

// Rota inicial
app.get("/", (req, res) => {
  res.json({ message: "APP está em execução" });
});

// Configuração do servidor e porta
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor está rodando na porta ${PORT}.`);
});
