const logo = `"https://kanzparty.com.br/api/images/KANZ.png"`;
const colors = require("../colors/kanz");

const styles = {
    main: `"
        font-family: sans-serif, arial, helvetica;
        text-align: center;
        max-width: 600px;
        padding: 20px;
    "`,
    title: `"
        color: ${colors.gray};
        text-align: center;
    "`,
    nome: `"
        color: ${colors.main};
        font-weight: bold;
    "`,
    image: `"
        width: 100%;
        max-width: 200px;
    "`,
    table: `"
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;   
        color: ${colors.black};
    "`,
    td: `"
        padding: 10px;
        color: ${colors.gray};
        border: 1px solid ${colors.black};
    "`,
    th: `"
        padding: 10px;
        border: 1px solid ${colors.black};
        background-color: ${colors.main};
        color: ${colors.white};
    "`,
    tdFooter: `"
        padding: 10px;
        border-top: 1px solid ${colors.black};
        background-color: ${colors.main};
        color: ${colors.white};
    "`,
}

exports.generate = (ingressos) => {
    const usuario_nome = ingressos[0].usuario_nome;
    const ingressosByLoteId = ingressos.reduce((acc, ingresso) => {
        if (!acc[ingresso.lote_id]) {
            acc[ingresso.lote_id] = [];
        }
        acc[ingresso.lote_id].push(ingresso);
        return acc;
    }, {});

    let html = `
        <html>
            <div style=${styles.main}>
                <table style=${styles.table}>
                    <tr>
                        <td colspan="2" style=${styles.title}>
                            <img src=${logo} alt="KANZ" style=${styles.image} />
                            <h3>
                                Olá, <span style=${styles.nome}>${usuario_nome}</span>.
                                <br />
                                Seus ingressos estão prontos!
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style=${styles.nome}>
                            Detalhes do pedido #${ingressos[0].carrinho_id}
                        </td>
                    </tr>
                    <tr>
                        <th style=${styles.th}>Ingresso</th>
                        <th style=${styles.th}>Quantidade</th>
                        <th style=${styles.th}>Preço</th>
                    </tr>
                    ${Object.entries(ingressosByLoteId).map(([loteId, ingressos]) => `
                        <tr>
                            <td style=${styles.td}>${ingressos[0].ingresso_descricao}</td>
                            <td style=${styles.td}>${ingressos.length}</td>
                            <td style=${styles.td}>R$ ${ingressos.reduce((acc, ingresso) => acc + Number.parseFloat(ingresso.lote_preco), 0).toString().replace(".", ",")}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td style=${styles.tdFooter}></td>
                        <td style=${styles.tdFooter}></td>
                        <td style=${styles.tdFooter}>Total: R$ ${ingressos.reduce((acc, ingresso) => acc + Number.parseFloat(ingresso.lote_preco), 0).toString().replace(".", ",")}</td>
                    </tr>
                </table>
                <br />
                <p style=${styles.nome}>
                    Você ainda pode acessar seus ingressos a qualquer momento na sua conta em nosso site:
                    <a href="https://kanzparty.com.br">
                        kanzparty.com.br
                    </a>
                </p>
            </div>
        </html>
    `;

    return html;
}
