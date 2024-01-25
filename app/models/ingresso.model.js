const sql = require("./db.js");

// Constructor
const Ingresso = function(ingresso) {
  this.id = ingresso.id;
  this.descricao = ingresso.descricao;
  this.empresa_id = ingresso.empresa_id;
  this.lotes = ingresso.lotes;
};

// Ingresso.create = (newIngresso, result) => {
//   sql.query("INSERT INTO ingressos SET ?", newIngresso, (err, res) => {
//     if (err) {
//       console.log("error: ", err);
//       result(err, null);
//       return;
//     }

//     console.log("created ingresso: ", { id: res.insertId, ...newIngresso });
//     result(null, { id: res.insertId, ...newIngresso });
//   });
// };

// Ingresso.findById = (id, result) => {
//   sql.query(`SELECT * FROM ingressos WHERE id = ${id}`, (err, res) => {
//     if (err) {
//       console.log("error: ", err);
//       result(err, null);
//       return;
//     }

//     if (res.length) {
//       console.log("found ingresso: ", res[0]);
//       result(null, res[0]);
//       return;
//     }

//     // not found Ingresso with the id
//     result({ kind: "not_found" }, null);
//   });
// };

Ingresso.getAll = (result) => {
    let query = `
        SELECT ingresso_id,
        ingresso_descricao,
        lote_descricao,
        lote_ordem,
        lote_data_inicio_venda,
        lote_data_fim_venda,
        ROUND(lote_preco / 100, 2) as lote_preco,
        lote_quantidade_maxima
        FROM ingressos i
        JOIN (
            SELECT *, ROW_NUMBER() OVER(PARTITION BY ingresso_id ORDER BY lote_ordem) as rn
            FROM lotes
            WHERE CURRENT_DATE BETWEEN lote_data_inicio_venda AND lote_data_fim_venda
            AND lote_quantidade > 0
        ) l USING (ingresso_id)
        WHERE l.rn = 1
    `;

    sql.query(query, (err, res) => {
        if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
        }

        res.forEach(element => {
            
        });

        result(null, res);
    });
};

Ingresso.updateById = (id, ingresso, result) => {
  sql.query(
    "UPDATE ingressos SET descricao = ?, telefone = ?, email = ?, senha = ? WHERE id = ?",
    [ingresso.descricao, ingresso.telefone, ingresso.email, ingresso.senha, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found Ingresso with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated ingresso: ", { id: id, ...ingresso });
      result(null, { id: id, ...ingresso });
    }
  );
};

Ingresso.remove = (id, result) => {
  sql.query("DELETE FROM ingressos WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found Ingresso with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted ingresso with id: ", id);
    result(null, res);
  });
};

Ingresso.removeAll = result => {
  sql.query("DELETE FROM ingressos", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} ingressos`);
    result(null, res);
  });
};

module.exports = Ingresso;
