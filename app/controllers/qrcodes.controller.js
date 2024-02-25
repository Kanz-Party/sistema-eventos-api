const QrCode = require("../models/qrcode.model.js");

exports.create = (req, res) => {
  QrCode.create(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating qrcodes.",
        error: err
      });
    else res.send(data);
  });
};
exports.findByHash = (req, res) => {
  if(req.params.auth !== '4ce6503a75b3223a8155243b03fa77199f24366ff47c011d2f17b5d0de54136d'){
    res.status(401).send({ message: "Não autorizado." });
    return;
  }
  QrCode.findByHash(req.params.qrcode, (err, data) => {
    if (err) {
      res.status(500).send({
        err: err.err || "ERRO_INESPERADO",
        message: err.message || "Um erro ocorreu enquanto recuperava o qrcode.",
      });
    } else res.send(data);
  });
}

exports.entrada = (req, res) => {
  if(req.params.auth !== '4ce6503a75b3223a8155243b03fa77199f24366ff47c011d2f17b5d0de54136d'){
    res.status(401).send({ message: "Não autorizado." });
    return;
  }
  QrCode.entrada(req.params.qrcode, (err, data) => {
    if (err) {
      res.status(500).send({
        err: err.err || "ERRO_INESPERADO",
        message: err.message || "Um erro ocorreu enquanto recuperava o qrcode.",
      });
    } else res.send(data);
  });
}
