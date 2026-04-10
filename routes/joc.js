const express = require('express');
const router = express.Router();
const { unirseSala, sortirSala, ReclamarCelda, getSala } = require('../public/javascripts/sales');
const { Partida, Jugador } = require('../models/models');

router.post('/join', (req, res) => {
  const { IdJugador } = req.body;
  if (!IdJugador) return res.status(400).json({ error: 'Falta IdJugador' });
  const sala = unirseSala(IdJugador);
  res.json(sala);
});

router.post('/leave', (req, res) => {
  const { IdJugador } = req.body;
  if (IdJugador) sortirSala(IdJugador);
  res.json({ ok: true });
});

router.post('/move', (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || buffer.length < 2) {
    return res.status(400).json({ error: 'Buffer binari invàlid' });
  }

  const fila = buffer[0];
  const col = buffer[1];
  const IdJugador = req.headers['x-jugador-id'];
  const IdSala = req.headers['x-sala-id'];

  if (!IdJugador || !IdSala) {
    return res.status(400).json({ error: 'Falten capçaleres X-Jugador-Id o X-Sala-Id' });
  }

  const sala = getSala(IdSala);
  if (!sala) return res.status(404).json({ error: 'Sala no trobada' });
  if (!sala.jugadors.includes(IdJugador)) {
    return res.status(403).json({ error: 'El jugador no pertany a aquesta sala' });
  }

  const exit = ReclamarCelda(IdSala, fila, col, IdJugador);
  const salaActualitzada = getSala(IdSala);

  res.json({
    exit,
    tabla: salaActualitzada.tabla,
    puntuacions: salaActualitzada.puntuacions,
    guanyador: salaActualitzada.guanyador || null  
  });
});

router.post('/resultat', async (req, res) => {
  //console.log("BODY:", req.body);

  const { IdSala, guanyador, puntuacions } = req.body;

  try {
    if (!IdSala || !guanyador || !puntuacions) {
      //console.log("Datos incompletos");
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    //console.log("Guardando partida...");
    await Partida.create({ IdSala, guanyador, puntuacions });
    //console.log("Guardado en Mongo");

    const jugadors = Object.keys(puntuacions);

    await Promise.all(jugadors.map(IdJugador =>
      Jugador.findOneAndUpdate(
        { IdJugador },
        {
          $inc: {
            totalPartides: 1,
            victories: IdJugador === guanyador ? 1 : 0,
            derrotes:  IdJugador === guanyador ? 0 : 1
          }
        },
        { upsert: true, new: true }
      )
    ));

    res.json({ ok: true });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'Error guardant partida' });
  }
});

router.get('/state/:IdSala', (req, res) => {
  const sala = getSala(req.params.IdSala);
  if (!sala) return res.status(404).json({ error: 'Sala no trobada' });
  res.json(sala);
});

module.exports = router;