// URL del tuo endpoint Codespace
const url = "https://solid-dollop-q7x56rjw6jh96gg-5004.app.github.dev/todo";

// Funzione per recuperare i dati
async function caricaTodo() {
  try {
    const response = await fetch(url);

    // Controllo eventuali errori nella risposta
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }

    const todos = await response.json();
    console.log("Dati ricevuti:", todos); // per debug

    mostraTodo(todos);

  } catch (error) {
    console.error("Errore fetch:", error);
    document.getElementById("todo-list").innerHTML = "<li>Errore nel caricamento dei dati</li>";
  }
}

// Funzione per mostrare i todo in pagina
function mostraTodo(todos) {
  const lista = document.getElementById("todo-list");
  lista.innerHTML = ""; // pulisce eventuali contenuti precedenti

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.textContent = todo.name;
    li.className = todo.isComplete ? "complete" : "incomplete";
    lista.appendChild(li);
  });
}

// Carica i todo all'apertura della pagina
caricaTodo();
