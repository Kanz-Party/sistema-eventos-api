const sql = require("./db.js");

// Constructor
const Empresa = function(empresa) {
  this.descricao = empresa.descricao;
  this.telefone = empresa.telefone;
  this.email = empresa.email;
  this.senha = empresa.senha;
};

Empresa.create = (newEmpresa, result) => {
  sql.query("INSERT INTO empresas SET ?", newEmpresa, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created empresa: ", { id: res.insertId, ...newEmpresa });
    result(null, { id: res.insertId, ...newEmpresa });
  });
};

Empresa.findById = (id, result) => {
  sql.query(`SELECT * FROM empresas WHERE id = ${id}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found empresa: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Empresa with the id
    result({ kind: "not_found" }, null);
  });
};

Empresa.getAll = (descricao, result) => {
  let query = "SELECT * FROM empresas";

  if (descricao) {
    query += ` WHERE descricao LIKE '%${descricao}%'`;
  }

  sql.query(query, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("empresas: ", res);
    result(null, res);
  });
};

Empresa.updateById = (id, empresa, result) => {
  sql.query(
    "UPDATE empresas SET descricao = ?, telefone = ?, email = ?, senha = ? WHERE id = ?",
    [empresa.descricao, empresa.telefone, empresa.email, empresa.senha, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found Empresa with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated empresa: ", { id: id, ...empresa });
      result(null, { id: id, ...empresa });
    }
  );
};

Empresa.remove = (id, result) => {
  sql.query("DELETE FROM empresas WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found Empresa with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted empresa with id: ", id);
    result(null, res);
  });
};

Empresa.removeAll = result => {
  sql.query("DELETE FROM empresas", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} empresas`);
    result(null, res);
  });
};

module.exports = Empresa;
