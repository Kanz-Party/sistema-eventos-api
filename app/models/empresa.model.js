const sql = require("./db.js");
const bcrypt = require('bcrypt');

// Constructor
const Empresa = function() {

};

Empresa.getHashLeitor = (body, result) => {
  let senha = body.senha;
  if(bcrypt.compareSync(senha, "$2b$10$hQJqsI8cezq//prNpIM7me3o9W/XdunuKaYvwtc5THg0FPFkGhwzG")){
    result(null, "4ce6503a75b3223a8155243b03fa77199f24366ff47c011d2f17b5d0de54136d");
    return;
  } else {
    result({ error: 'SENHA_INVALIDA' }, null);
  }
};



module.exports = Empresa;
