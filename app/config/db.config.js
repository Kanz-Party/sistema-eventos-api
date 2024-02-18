let config;

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    config = {
      HOST: "mysql.devfelipeborges.com.br",
      USER: "devfelipeborge02",
      PASSWORD: "lgyIZ9aw",
      DB: "devfelipeborge02"
    };
  } else {
  config = {
    HOST: "mysql.kanzparty.com.br",
    USER: "kanzparty",
    PASSWORD: "HFt2pR7kB5",
    DB: "kanzparty"
  };
}

module.exports = config;