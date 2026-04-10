var express = require('express');
var router = express.Router();
const { Partida, Jugador } = require('../models/models');

router.get('/', async (req, res, next) => {
  try {
    const jugadors = await Jugador.find().sort({ victories: -1 });
    const partides = await Partida.find().sort({ dataFi: -1 }).limit(10);

    //Convertir el Map a objeto plano antes de pasar al pug
    const partidesPlanes = partides.map(p => ({
      IdSala: p.IdSala,
      guanyador: p.guanyador,
      puntuacions: Object.fromEntries(p.puntuacions),
      dataFi: p.dataFi
    }));

    res.render('index', { title: 'Joc', jugadors, partides: partidesPlanes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;