const express = require("express");
const cors = require("cors");
const crypto = require('crypto');
const path = require('path'); 
const chaveSecreta = crypto.randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));
var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

app.use('/images', express.static(path.join(__dirname, 'app', 'assets', 'images')));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


require("./app/routes/mercadoPago.routes.js")(app);
require("./app/routes/ingresso.routes.js")(app);
require("./app/routes/carrinho.routes.js")(app);
require("./app/routes/qrcodes.routes.js")(app);

app.get('/redefinir-senha', (req, res) => {
  // O token seria normalmente extraído da query string ou de um parâmetro de rota
  const token = req.query.token;
  
  // Certifique-se de validar o token aqui antes de prosseguir

  // Renderiza a página de redefinição de senha com o token
  res.render('redefinir-senha', { token });
});

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
const PORT = 21021;
app.listen(PORT, () => {
  console.log(`Servidor está rodando na porta ${PORT}.`);
});
