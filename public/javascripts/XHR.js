const IdJugador = prompt("Introdueix el ID de jugador");
let IdSala = null;
let pollingInterval = null;
let ultimaSalaConocida = null;
let fiDeJocGestionat = false;

function habilitarTabla(habilitat) {
  const t = document.querySelector('table');
  if (!t) return;
  t.style.pointerEvents = habilitat ? 'auto' : 'none';
  t.style.opacity = habilitat ? '1' : '0.4';
}

function unirseSala() {
  fiDeJocGestionat = false;
  ultimaSalaConocida = null;
  habilitarTabla(false);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/join");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status !== 200) return alert("Error al unir-se: " + xhr.responseText);
    const sala = JSON.parse(xhr.responseText);
    IdSala = sala.id;
    renderTabla(sala.tabla);
    actualizarPuntuaciones(sala.puntuacions);
    habilitarTabla(true);
    iniciarPolling();
  };

  xhr.onerror = () => alert("Error de xarxa");
  xhr.send(JSON.stringify({ IdJugador }));
}

function moverCelda(fila, col) {
  if (!IdSala) return;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/move");
  xhr.responseType = "json";
  xhr.setRequestHeader("X-Jugador-Id", IdJugador);
  xhr.setRequestHeader("X-Sala-Id", IdSala);
  xhr.setRequestHeader("Content-Type", "application/octet-stream");

  xhr.onload = () => {
    if (xhr.status !== 200) return alert("Error al fer el moviment");
    const data = xhr.response;
    if (data.exit) {
      renderTabla(data.tabla);
      actualizarPuntuaciones(data.puntuacions);
      gestionarFiDeJoc(data); //comprovar guanyador després de cada move
    } else {
      alert("Cel·la ja ocupada!");
    }
  };

  const buffer = new ArrayBuffer(2);
  const view = new Uint8Array(buffer);
  view[0] = fila;
  view[1] = col;
  xhr.send(buffer);
}

function iniciarPolling() {
  pollingInterval = setInterval(async () => {
    try {
      const resp = await fetch(`/joc/state/${IdSala}?t=${Date.now()}`);
      
      if (resp.status === 404) {
        clearInterval(pollingInterval);
        //Si teníamos sala con guanyador, mostrarla igualmente
        if (ultimaSalaConocida?.guanyador) {
          gestionarFiDeJoc(ultimaSalaConocida);
        }
        return;
      }

      if (!resp.ok) return;

      const sala = await resp.json();
      console.log(`POLL guanyador=${sala?.guanyador} fiDeJocGestionat=${fiDeJocGestionat}`);
      if (!sala) return;

      ultimaSalaConocida = sala;  // guardar siempre la última sala
      renderTabla(sala.tabla);
      actualizarPuntuaciones(sala.puntuacions);
      gestionarFiDeJoc(sala);

    } catch (e) {
      console.error('Error polling:', e);
    }
  }, 800);
}

async function gestionarFiDeJoc(sala) {
  if (!sala.guanyador) return;
  if (fiDeJocGestionat) return;
  fiDeJocGestionat = true;

  clearInterval(pollingInterval);
  habilitarTabla(false);

  const missatge = sala.guanyador === IdJugador
    ? 'Has guanyat!'
    : `Ha guanyat ${sala.guanyador}`;

  // estat final o timeout 3s
  const estatFinal = await Promise.race([
    fetch(`/joc/state/${IdSala}?t=${Date.now()}`).then(r => r.json()),
    new Promise(resolve => setTimeout(() => resolve(sala), 3000))
  ]);

  //guardar resultat i fer leave EN PARAL·LEL
  await Promise.all([
    fetch('/joc/resultat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        IdSala,
        guanyador: estatFinal.guanyador,
        puntuacions: estatFinal.puntuacions
      })
    }),
    fetch('/joc/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdJugador })
    })
  ]);

  const reiniciar = confirm(`${missatge}\n\nVols jugar de nou?`);
  if (reiniciar) {
    IdSala = null;
    renderTabla(Array(6).fill(null).map(() => Array(5).fill(null)));
    unirseSala();
  }
}

function renderTabla(tabla) {
  for (let i = 0; i < tabla.length; i++) {
    for (let j = 0; j < tabla[i].length; j++) {
      const celda = document.querySelector(`td[data-row='${i}'][data-col='${j}']`);
      if (!celda) continue;
      celda.style.backgroundColor = tabla[i][j]
        ? (tabla[i][j] === IdJugador ? 'blue' : 'red')
        : '';
    }
  }
}

function actualizarPuntuaciones(puntuacions) {
  console.log("Puntuacions:", puntuacions);
}

document.addEventListener('click', (e) => {
  const td = e.target.closest('td[data-row]');
  if (!td) return;
  moverCelda(parseInt(td.dataset.row), parseInt(td.dataset.col));
});

window.addEventListener('beforeunload', () => {
  clearInterval(pollingInterval);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/leave");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ IdJugador }));
});

document.addEventListener('DOMContentLoaded', () => {
  unirseSala();
});