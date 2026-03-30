const sales = new Map();

function crearSala(IdJugador) {
  const IdSala = Math.random().toString(36).substring(2, 8); //valor aleatorio entre (0–9 a–z) = 36
  const sala = {
    id: IdSala,
    jugadors: [IdJugador],
    tabla: Array(6).fill(null).map(() => Array(5).fill(null)), // Crear una tabla 6x5 con null para que no estén vacías
    // y poder guardar valores en cada celda del array
    puntuacions: {}, // {IdJugador: puntuacio}
  };
  sala.puntuacions[IdJugador] = 0;
  sales.set(IdSala, sala);
  return sala;
}

function unirseSala(IdJugador) {
  for (let sala of sales.values()) {
    if (sala.jugadors.length === 1) { //Buscar sala con 1 jugador
      sala.jugadors.push(IdJugador);
      sala.puntuacions[IdJugador] = 0;
      return sala;
    }
  }
  // Si no hay sala disponible, crear una nueva
  return crearSala(IdJugador);
}

function sortirSala(IdJugador) {
  for (let [IdSala, sala] of sales.entries()) {
    if (sala.jugadors.includes(IdJugador)) {
      sala.jugadors = sala.jugadors.filter(p => p !== IdJugador);  // borramos al jugador de la sala
      delete sala.puntuacions[IdJugador]; //borrar puntuación jugador si ya no está en sala
      // Si no quedan jugadores, borrar sala
      if (sala.jugadors.length === 0) sales.delete(IdSala);
      return true;
    }
  }
  return false;
}

function ReclamarCelda(IdSala, fila, col, IdJugador) {
  const sala = sales.get(IdSala);
  if (!sala) return false; 
  if (sala.tabla[fila][col] !== null) return false; // colisión
  sala.tabla[fila][col] = IdJugador;
  sala.puntuacions[IdJugador]++;
  return true;
}

function getSala(IdSala) { //getter
  return sales.get(IdSala);
}

module.exports = { crearSala, unirseSala, sortirSala, ReclamarCelda, getSala };