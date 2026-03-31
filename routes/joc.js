const express = require('express');
const router = express.Router();
const { unirseSala, sortirSala, ReclamarCelda, getSala } = require('../public/javascripts/sales');

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

router.post('/resultat', (req, res) => {
  const { IdSala, guanyador, puntuacions } = req.body;
  console.log(`Partida ${IdSala} acabada. Guanyador: ${guanyador}`, puntuacions);
  res.json({ ok: true });
});

router.get('/state/:IdSala', (req, res) => {
  const sala = getSala(req.params.IdSala);
  if (!sala) return res.status(404).json({ error: 'Sala no trobada' });
  res.json(sala);
});

module.exports = router;