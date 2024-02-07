create table devfelipeborge02.carrinhos
(
    carrinho_id        int auto_increment
        constraint `PRIMARY`
        primary key,
    carrinho_hash      varchar(60)       null,
    carrinho_expiracao datetime          null,
    carrinho_ativo     tinyint default 1 not null,
    constraint carrinhos_pk
        unique (carrinho_id)
);

create table devfelipeborge02.empresas
(
    empresa_id            int auto_increment
        constraint `PRIMARY`
        primary key,
    empresa_descricao     varchar(150) null,
    empresa_email         varchar(150) null,
    empresa_telefone      varchar(150) null,
    empresa_senha         varchar(150) null,
    empresa_access_token  varchar(150) null,
    empresa_public_key    varchar(150) null,
    empresa_client_id     bigint       null,
    empresa_client_secret varchar(150) null,
    constraint empresas_pk2
        unique (empresa_id)
);

create table devfelipeborge02.ingressos
(
    ingresso_id        int auto_increment
        constraint `PRIMARY`
        primary key,
    ingresso_descricao varchar(50) null,
    empresa_id         int         null,
    constraint ingressos_pk2
        unique (ingresso_id),
    constraint ingressos_empresas_id_fk
        foreign key (empresa_id) references devfelipeborge02.empresas (empresa_id)
);

create table devfelipeborge02.lotes
(
    lote_id                int auto_increment
        constraint `PRIMARY`
        primary key,
    ingresso_id            int          null,
    lote_descricao         varchar(150) null,
    lote_ordem             int          null,
    lote_preco             int          null,
    lote_data_inicio_venda datetime     null,
    lote_data_fim_venda    datetime     null,
    lote_quantidade        int          null,
    lote_quantidade_maxima int          null,
    constraint lotes_pk2
        unique (lote_id),
    constraint lotes_ingressos_id_fk
        foreign key (ingresso_id) references devfelipeborge02.ingressos (ingresso_id)
);

create table devfelipeborge02.carrinhos_lotes
(
    carrinho_lote_id int auto_increment
        constraint `PRIMARY`
        primary key,
    carrinho_id      int not null,
    lote_id          int not null,
    lote_preco       int null,
    lote_quantidade  int null,
    constraint carrinhos_lotes_pk2
        unique (carrinho_lote_id),
    constraint carrinhos_lotes_carrinhos_carrinho_id_fk
        foreign key (carrinho_id) references devfelipeborge02.carrinhos (carrinho_id),
    constraint carrinhos_lotes_lotes_lote_id_fk
        foreign key (lote_id) references devfelipeborge02.lotes (lote_id)
);

create table devfelipeborge02.usuarios
(
    usuario_id       int auto_increment
        constraint `PRIMARY`
        primary key,
    usuario_nome     varchar(255) null,
    usuario_cpf      varchar(25)  null,
    usuario_email    varchar(150) null,
    usuario_telefone varchar(30)  null,
    usuario_senha    varchar(100) null,
    usuario_endereco varchar(255) null,
    usuario_numero   int          null,
    usuario_cep      varchar(9)   null,
    constraint usuarios_pk2
        unique (usuario_id)
);

create table devfelipeborge02.pagamentos
(
    pagamento_id            int auto_increment
        constraint `PRIMARY`
        primary key,
    carrinho_id             int          null,
    usuario_id              int          null,
    pagamento_status        tinyint      null comment '(-1) - erro; (0) - pendente; (1) - aprovado',
    pagamento_checkout_url  varchar(255) null,
    pagamento_preference_id varchar(50)  null,
    pagamento_expiracao     datetime     null,
    constraint pagamentos_carrinhos_carrinho_id_fk
        foreign key (carrinho_id) references devfelipeborge02.carrinhos (carrinho_id),
    constraint pagamentos_usuarios_usuario_id_fk
        foreign key (usuario_id) references devfelipeborge02.usuarios (usuario_id)
);

create table devfelipeborge02.qrcodes
(
    qrcode_id   int auto_increment
        constraint `PRIMARY`
        primary key,
    qrcode_hash char(64) null,
    usuario_id  int      null,
    lote_id     int      null,
    constraint qrcodes_pk2
        unique (qrcode_id),
    constraint qrcodes_lotes_lote_id_fk
        foreign key (lote_id) references devfelipeborge02.lotes (lote_id),
    constraint qrcodes_usuarios_usuario_id_fk
        foreign key (usuario_id) references devfelipeborge02.usuarios (usuario_id)
);

