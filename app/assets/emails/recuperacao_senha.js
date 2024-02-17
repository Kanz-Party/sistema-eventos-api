const logo = `"https://kanzparty.com.br/api/images/KANZ.png"`;
const colors = require("../colors/kanz");

const styles = {
    // seus estilos permanecem os mesmos
};

exports.generateRecoveryEmail = (dadosRecuperacao) => {
    const { nomeUsuario, tokenRecuperacao, urlBase } = dadosRecuperacao;
    const linkRecuperacao = `${urlBase}/redefinir-senha?token=${tokenRecuperacao}`;

    let html = `
        <html>
            <div style=${styles.main}>
                <table style=${styles.table}>
                    <tr>
                        <td colspan="3" style=${styles.title}>
                            <h3>
                                Olá, você solicitou a redefinição de senha.
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style=${styles.td}>
                            Clique no link abaixo para redefinir sua senha. Este link expirará em <strong>30 minutos</strong>.
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style=${styles.td}>
                            <a href="${linkRecuperacao}" style="color: ${colors.main};">Redefinir Senha</a>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style=${styles.tdFooter}>
                            Se você não solicitou uma redefinição de senha, por favor ignore este e-mail.
                        </td>
                    </tr>
                </table>
            </div>
        </html>
    `;

    return html;
}
