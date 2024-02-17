const sql = require("./db.js");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Você pode ajustar isso conforme necessário
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const recuperacao_senha_email = require("../assets/emails/recuperacao_senha.js");

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

Usuario.redefinirSenha = (token, novaSenha, callback) => {
    // Sua lógica de busca do token e atualização da senha
    sql.query('SELECT * FROM tokens_recuperacao WHERE token = ?', [token], (err, resultado) => {
        if (err) {
            callback(err, null);
            return;
        }

        if (resultado.length === 0) {
            callback('Token inválido ou expirado', null);
            return;
        }

        const tokenData = resultado[0];

        console.log('tokenData', tokenData)
     
        
        if (tokenData.expirationDate < new Date() || tokenData.isUsed) {
            callback('Token inválido ou expirado', null);
            return;
        }

        // Aqui, você precisaria implementar a criptografia da nova senha
        const senhaCriptografada = bcrypt.hashSync(novaSenha, saltRounds);

        console.log("new password: ", senhaCriptografada)



        // Continuação da lógica para atualizar a senha e marcar o token como utilizado

        sql.query('UPDATE usuarios SET usuario_senha = ? WHERE usuario_id = ?', [senhaCriptografada, tokenData.usuario_id], (err, resultado) => {
            if (err) {
                callback(err, null);
                return;
            }

            sql.query('UPDATE tokens_recuperacao SET isUsed = 1 WHERE token = ?',

                [token], (err, resultado) => {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    callback(null, 'Senha atualizada com sucesso');
                });
        });
    });
};

Usuario.redefinirSenhaToken = (email, callback) => {
    // Sua lógica de busca do usuário e geração do token
    sql.query('SELECT * FROM usuarios WHERE usuario_email = ?', [email], (err, resultado) => {
        if (err) {
            callback(err, null);
            return;
        }

        if (resultado.length === 0) {
            callback('E-mail não cadastrado', null);
            return;
        }

        const usuario = resultado[0];

        // Aqui, você precisaria implementar a lógica para gerar um token de recuperação de senha

        const token = jwt.sign({ id: usuario.usuario_id }, process.env.JWT_SECRET, {
            expiresIn: '1h' // 1 hora
        });

        sql.query('DELETE FROM tokens_recuperacao WHERE usuario_id = ?', [usuario.usuario_id], (err, resultado) => {
            if (err) {
                callback(err, null);
                return;
            }
        });

        // Continuação da lógica para salvar o token no banco de dados

        sql.query('INSERT INTO tokens_recuperacao (usuario_id, token, expirationDate) VALUES (?, ?, ?)',

           //1 day date
            [usuario.usuario_id, token, new Date(new Date().getTime() + 60 * 60 * 1000)], (err, resultado) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                console.log(usuario)

                // Continuação da lógica para enviar o e-mail com o token

                sendEmails(usuario.usuario_nome, usuario.usuario_email, token, 'https://kanzparty.com.br/api')



                callback(null, token);
            });
    });
};

function sendEmails(nomeUsuario, emailUsuario, token, urlBase) {
    return new Promise(async (resolve, reject) => {
        const dadosRecuperacao = {
            nomeUsuario,
            tokenRecuperacao: token,
            urlBase
        };

        const html = recuperacao_senha_email.generateRecoveryEmail(dadosRecuperacao);

        let transporter = nodemailer.createTransport({
            host: 'smtp-vip.kinghost.net.',
            auth: {
                user: 'naoresponda@kanzparty.com.br',
                pass: 'W83qp5eQ40@'
            }
        });

        let mailOptions = {
            from: 'naoresponda@kanzparty.com.br',
            to: emailUsuario,
            subject: 'Recuperação de Senha',
            html: html
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log('Email enviado: ' + info.response);
                resolve(info.response);
            }
        });
    });
}




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
