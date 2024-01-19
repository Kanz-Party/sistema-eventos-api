const sql = require("./db.js");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Você pode ajustar isso conforme necessário

const Usuario = function (usuario) {
    this.nome = usuario.nome;
    this.cpf = usuario.cpf;
    this.email = usuario.email;
    this.telefone = usuario.telefone;
    if (usuario.senha) {
        this.senha = bcrypt.hashSync(usuario.senha, saltRounds); // Criptografando a senha
    } else {
        this.senha = null;
    }
    // ...
};

Usuario.create = (newUsuario, result) => {
    // Primeiro, verifica se já existe um usuário com o mesmo e-mail
    sql.query("SELECT * FROM usuarios WHERE email = ?", [newUsuario.email], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length > 0) {
            console.log("E-mail já cadastrado");
            result({ kind: "email_existente" }, null);
            return;
        }

        // Depois, verifica se já existe um usuário com o mesmo CPF
        sql.query("SELECT * FROM usuarios WHERE cpf = ?", [newUsuario.cpf], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.length > 0) {
                console.log("CPF já cadastrado");
                result({ kind: "cpf_existente" }, null);
                return;
            }

            // Se não existir, insere o novo usuário
            sql.query("INSERT INTO usuarios SET ?", newUsuario, (err, res) => {
                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                }

                console.log("created usuario: ", { id: res.insertId, ...newUsuario });
                result(null, { id: res.insertId, ...newUsuario });
            });
        });
    });
};


Usuario.findById = (id, result) => {
    sql.query(`SELECT * FROM usuarios WHERE id = ${id}`, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found usuario: ", res[0]);
            result(null, res[0]);
            return;
        }

        // not found Usuario with the id
        result({ kind: "not_found" }, null);
    });
};

Usuario.getAll = (nome, result) => {
    let query = "SELECT * FROM usuarios";

    if (nome) {
        query += ` WHERE nome LIKE '%${nome}%'`;
    }

    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("usuarios: ", res);
        result(null, res);
    });
};

Usuario.updateById = (id, usuario, result) => {
    sql.query(
        "UPDATE usuarios SET nome = ?, cpf = ?, email = ?, telefone = ?, senha = ? WHERE id = ?",
        [usuario.nome, usuario.cpf, usuario.email, usuario.telefone, usuario.senha, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Usuario with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated usuario: ", { id: id, ...usuario });
            result(null, { id: id, ...usuario });
        }
    );
};

Usuario.remove = (id, result) => {
    sql.query("DELETE FROM usuarios WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        if (res.affectedRows == 0) {
            // not found Usuario with the id
            result({ kind: "not_found" }, null);
            return;
        }

        console.log("deleted usuario with id: ", id);
        result(null, res);
    });
};

Usuario.removeAll = result => {
    sql.query("DELETE FROM usuarios", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log(`deleted ${res.affectedRows} usuarios`);
        result(null, res);
    });
};

Usuario.findByEmail = (email, result) => {
    sql.query(`SELECT * FROM usuarios WHERE email = '${email}'`, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            result(null, res[0]);
            return;
        }

        // not found Usuario with the email
        result({ kind: "not_found" }, null);
    });
};

module.exports = Usuario;
