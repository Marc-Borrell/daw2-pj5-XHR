const sales = new Map();

function crearSala(IdJugador) {
  const IdSala = Math.random().toString(36).substring(2, 8);
  const sala = {
    id: IdSala,
    jugadors: [IdJugador],
    tabla: Array(6).fill(null).map(() => Array(5).fill(null)),
    puntuacions: { [IdJugador]: 0 },
    guanyador: null
  };
  sales.set(IdSala, sala);
  return sala;
}

function unirseSala(IdJugador) {
  for (let sala of sales.values()) {
    if (sala.jugadors.length === 1 && !sala.guanyador) {
      sala.jugadors.push(IdJugador);
      sala.puntuacions[IdJugador] = 0;
      return sala;
    }
  }
  return crearSala(IdJugador);
}

function sortirSala(IdJugador) {
  for (let [IdSala, sala] of sales.entries()) {
    if (sala.jugadors.includes(IdJugador)) {
      sala.jugadors = sala.jugadors.filter(p => p !== IdJugador);
      console.log(`LEAVE ${IdJugador} → jugadors restants: ${sala.jugadors.length}, guanyador: ${sala.guanyador}`);
      // Si hay guanyador, dejar la sala viva un poco más para que el rival haga polling
      if (sala.jugadors.length === 0 && !sala.guanyador) {
        sales.delete(IdSala);
        console.log(`SALA ${IdSala} ELIMINADA`);
      }
      return true;
    }
  }
  return false;
}

function ReclamarCelda(IdSala, fila, col, IdJugador) {
  const sala = sales.get(IdSala);
  if (!sala) return false;
  if (sala.tabla[fila][col] !== null) return false;
  sala.tabla[fila][col] = IdJugador;
  sala.puntuacions[IdJugador]++;

   //detectar fin de partida
  const totalCeldas = sala.tabla.length * sala.tabla[0].length; // 30
  const ocupades = Object.values(sala.puntuacions).reduce((a, b) => a + b, 0);
  if (ocupades >= totalCeldas) {
    sala.guanyador = Object.entries(sala.puntuacions)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  return true;
}

function getSala(IdSala) {
  return sales.get(IdSala);
}

// Limpieza de salas inactivas cada 30s (gestió desconnexions)
setInterval(() => {
  const ara = Date.now();
  for (let [IdSala, sala] of sales.entries()) {
    if (ara - (sala.ultimaActivitat || ara) > 2 * 60 * 1000) {
      sales.delete(IdSala);
    }
  }
}, 30000);

module.exports = { crearSala, unirseSala, sortirSala, ReclamarCelda, getSala };