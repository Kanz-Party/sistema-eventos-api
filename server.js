const express = require("express");
const cors = require("cors");
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
