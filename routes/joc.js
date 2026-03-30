const express = require('express');
const router = express.Router();
const { unirseSala, sortirSala, ReclamarCelda, getSala } = require('../public/javascripts/sales');

// Unirse a una sala
router.post('/join', (req, res) => {
  const { IdJugador } = req.body;
  const sala = unirseSala(IdJugador);
  res.json(sala);
});

// Salir de la sala
router.post('/leave', (req, res) => {
  const { IdJugador } = req.body;
  sortirSala(IdJugador);
  res.json({ ok: true });
});

// Hacer un movimiento
router.post('/move', (req, res) => {
  const { IdSala, fila, col, IdJugador } = req.body;
  const exit = ReclamarCelda(IdSala, fila, col, IdJugador);
  const sala = getSala(IdSala);
  res.json({ exit, tabla: sala.tabla, puntuacions: sala.puntuacions });
});

// Obtener estado de la sala
router.get('/state/:IdSala', (req, res) => {
  const sala = getSala(req.params.IdSala);
  if (!sala) return res.status(404).json({ error: 'Sala no trobada' });
  res.json(sala);
});

module.exports = router;