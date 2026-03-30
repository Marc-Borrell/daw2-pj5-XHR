const IdJugador = prompt("Introdueix el ID de jugador");
let IdSala = null;
let pollingInterval = null; 

function unirseSala() {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/join");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status !== 200) return alert("Error al unir-se: " + xhr.responseText);
    const sala = JSON.parse(xhr.responseText);
    IdSala = sala.id;
    renderTabla(sala.tabla);
    actualizarPuntuaciones(sala.puntuacions);
    iniciarPolling(); 
  };

  xhr.onerror = () => alert("Error de xarxa");
  xhr.send(JSON.stringify({ IdJugador }));
}

function moverCelda(fila, col) {
  if (!IdSala) return alert("No estàs en cap sala");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/move");
  xhr.responseType = "json";
  xhr.setRequestHeader("X-Jugador-Id", IdJugador);
  xhr.setRequestHeader("X-Sala-Id", IdSala);
  xhr.setRequestHeader("Content-Type", "application/octet-stream"); // MIME per a fitxers binaris desconeguts

  xhr.onload = () => {
    if (xhr.status !== 200) return alert("Error al fer el moviment");
    const data = xhr.response;
    if (data.exit) {
      renderTabla(data.tabla);
      actualizarPuntuaciones(data.puntuacions);
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
  pollingInterval = setInterval(() => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/joc/state/${IdSala}`);
    xhr.responseType = "json";

    xhr.onload = () => {
      if (xhr.status !== 200) return;
      const sala = xhr.response;
      renderTabla(sala.tabla);
      actualizarPuntuaciones(sala.puntuacions);

      if (sala.guanyador) {
        clearInterval(pollingInterval);
        alert(`Ha guanyat: ${sala.guanyador}`);
      }
    };

    xhr.send();
  }, 800);
}

function pararPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
}

function renderTabla(tabla) {
  for (let i = 0; i < tabla.length; i++) {
    for (let j = 0; j < tabla[i].length; j++) {
      const celda = document.querySelector(`td[data-row='${i}'][data-col='${j}']`);
      if (!celda) continue;
      if (tabla[i][j]) {
        celda.style.backgroundColor = tabla[i][j] === IdJugador ? 'blue' : 'red';
      } else {
        celda.style.backgroundColor = 'white';
      }
    }
  }
}

function actualizarPuntuaciones(puntuacions) {
  console.log("Puntuacions:", puntuacions);
}

document.addEventListener('click', (e) => {
  const td = e.target.closest('td[data-row]');
  if (!td) return;
  const fila = parseInt(td.dataset.row);
  const col = parseInt(td.dataset.col);
  moverCelda(fila, col);
});

//Avisa al servidor al cerrar la pestaña
window.addEventListener('beforeunload', () => {
  pararPolling();
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/joc/leave");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ IdJugador }));
});

document.addEventListener('DOMContentLoaded', () => {
  unirseSala();
});