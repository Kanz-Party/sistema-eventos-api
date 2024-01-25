const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require('crypto');
const chaveSecreta = crypto.randomBytes(32).toString('hex');


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
  if (req.session && req.session.usuario) {
    // O usuário está autenticado, permitir o acesso
    next();
  } else {
    // O usuário não está autenticado, redirecionar para página de login ou retornar erro
    res.status(401).json({ message: "Você não está autenticado." });
  }
};

// Rota de login
app.post("/login", (req, res) => {
  require("./app/models/login.js").login(req, res);
});

require("./app/routes/ingresso.routes.js")(app);
// Rotas protegidas que exigem autenticação
app.use(verificaAutenticacao);
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
