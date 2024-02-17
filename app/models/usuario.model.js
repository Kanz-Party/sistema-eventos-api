const sql = require("./db.js");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Você pode ajustar isso conforme necessário
const login = require("./login.js");
const jwt = require('jsonwebtoken');

const Usuario = function (usuario) {
    this.usuario_nome = usuario.nome;
    this.usuario_cpf = usuario.cpf;
    this.usuario_email = usuario.email;
    this.usuario_cep = usuario.cep;
    this.usuario_endereco = usuario.endereco;
    this.usuario_telefone = usuario.telefone;
    if (usuario.senha) {
        this.usuario_senha = bcrypt.hashSync(usuario.senha, saltRounds); // Criptografando a senha
    } else {
        this.usuario_senha = null;
    }
    // ...
};

Usuario.create = (newUsuario, result) => {
    // Primeiro, verifica se já existe um usuário com o mesmo e-mail
    sql.query("SELECT * FROM usuarios WHERE usuario_email = ?", [newUsuario.usuario_email], (err, res) => {
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
        sql.query("SELECT * FROM usuarios WHERE usuario_cpf = ?", [newUsuario.usuario_cpf], (err, res) => {
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

Usuario.createWithLogin = (newUsuario, result) => {
    // Primeiro, verifica se já existe um usuário com o mesmo e-mail
    sql.query("SELECT * FROM usuarios WHERE usuario_email = ?", [newUsuario.usuario_email], (err, res) => {
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
        sql.query("SELECT * FROM usuarios WHERE usuario_cpf = ?", [newUsuario.usuario_cpf], (err, res) => {
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
                const token = jwt.sign({ id: res.insertId }, process.env.JWT_SECRET, {
                    expiresIn: '1h' // 5 minutos
                });

                // Enviar o token e informações do usuário como resposta
                result(null, {
                    message: "Usuário criado e login bem-sucedido.",
                    usuario: {
                        id: res.insertId,
                        nome: newUsuario.usuario_nome,
                        email: newUsuario.usuario_email
                    },
                    token: token
                });
            });
        });
    });
};


Usuario.update = (id, usuarioData, result) => {
    console.log('dataaaaaa', usuarioData);
    // Primeiro, verifica se o e-mail já existe e pertence a outro usuário
    sql.query("SELECT * FROM usuarios WHERE usuario_email = ? AND usuario_id != ?", [usuarioData.usuario_email, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length > 0) {
            console.log("E-mail já cadastrado por outro usuário");
            result({ kind: "email_existente" }, null);
            return;
        }

        // Depois, verifica se o CPF já existe e pertence a outro usuário
        sql.query("SELECT * FROM usuarios WHERE usuario_cpf = ? AND usuario_id != ?", [usuarioData.usuario_cpf, id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.length > 0) {
                console.log("CPF já cadastrado por outro usuário");
                result({ kind: "cpf_existente" }, null);
                return;
            }

            // Verifica se uma nova senha foi fornecida
            if (usuarioData.senha) {
                bcrypt.hash(usuarioData.senha, saltRounds, (err, hash) => {
                    if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                    }

                    // Atualiza a senha com a versão criptografada
                    usuarioData.senha = hash;

                    // Agora, atualiza o usuário no banco de dados
                    sql.query("UPDATE usuarios SET ? WHERE usuario_id = ?", [usuarioData, id], (err, res) => {
                        if (err) {
                            console.log("error: ", err);
                            result(err, null);
                            return;
                        }

                        console.log("updated usuario: ", { id: id, ...usuarioData });
                        result(null, { id: id, ...usuarioData });
                    });
                });
            } else {
                // Se nenhuma senha for fornecida, remove a propriedade senha do objeto usuarioData
                const { senha, ...usuarioDataSemSenha } = usuarioData;

                // Atualiza os outros dados do usuário
                sql.query("UPDATE usuarios SET ? WHERE usuario_id = ?", [usuarioDataSemSenha, id], (err, res) => {
                    if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                    }

                    console.log("updated usuario: ", { id: id, ...usuarioDataSemSenha });
                    result(null, { id: id, ...usuarioDataSemSenha });
                });
            }
        });
    });
};


Usuario.findById = (id, result) => {
    sql.query(`SELECT * FROM usuarios WHERE usuario_id = ${id}`, (err, res) => {
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
        query += ` WHERE usuario_nome LIKE '%${nome}%'`;
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
        "UPDATE usuarios SET usuario_nome = ?, usuario_cpf = ?, usuario_email = ?, usuario_telefone = ?, usuario_senha = ? WHERE usuario_id = ?",
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
    sql.query("DELETE FROM usuarios WHERE usuario_id = ?", id, (err, res) => {
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
    sql.query(`SELECT * FROM usuarios WHERE usuario_email = ?`, [email], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            result(null, res[0]); // Retorna o primeiro usuário encontrado
        } else {
            // Não encontrou o usuário com o e-mail fornecido
            result({ kind: "not_found" }, null);
        }
    });
};




module.exports = Usuario;
