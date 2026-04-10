const mongoose = require('mongoose');

const PartidaSchema = new mongoose.Schema({
  IdSala:      { type: String, required: true },
  guanyador:   { type: String, required: true },
  puntuacions: { type: Map, of: Number },
  dataFi:      { type: Date, default: Date.now }
});

const JugadorSchema = new mongoose.Schema({
  IdJugador:    { type: String, required: true, unique: true },
  victories:    { type: Number, default: 0 },
  derrotes:     { type: Number, default: 0 },
  totalPartides:{ type: Number, default: 0 }
});

const Partida = mongoose.model('Partida', PartidaSchema);
const Jugador = mongoose.model('Jugador', JugadorSchema);

module.exports = { Partida, Jugador };