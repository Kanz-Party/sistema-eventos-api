const sql = require("./db.js");

// Constructor
const Ingresso = function(ingresso) {
  this.id = ingresso.id;
  this.descricao = ingresso.descricao;
  this.empresa_id = ingresso.empresa_id;
  this.lotes = ingresso.lotes;
};

Ingresso.getAll = (result) => {
    let query = `
        SELECT ingresso_id,
        ingresso_descricao,
        lote_id,
        lote_descricao,
        lote_quantidade,
        FORMAT(ROUND(lote_preco / 100, 2), 2) as lote_preco,
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

        res.forEach(lote => {
          if(lote.lote_quantidade < lote.lote_quantidade_maxima) {
            lote.lote_quantidade_maxima = lote.lote_quantidade;
          }

          //remover lote_quantidade do objeto
          delete lote.lote_quantidade;
        });

        result(null, res);
    });
};


module.exports = Ingresso;
