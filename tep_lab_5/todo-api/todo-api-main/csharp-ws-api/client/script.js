const API_TODO = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/todo";
const API_USERS = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/user"

let timerPolling=null;
let arrayElementiASchermo=[];

//LOGIN E COOKIE
// Funzione chiamata al submit del form
function loginForm(event) {
    event.preventDefault();
    const nome = document.getElementById("login-nome").value.toLowerCase().trim();
    const email = document.getElementById("login-email").value.toLowerCase().trim();

    fetch(API_USERS)
    .then(res => res.json())
    .then(utenti => {
        const utenteTrovato = utenti.find(u => 
            u.name.toLowerCase() === nome && 
            u.email.toLowerCase() === email
        );

        if (utenteTrovato) {
            settaSessione(utenteTrovato);
        } else {
            document.getElementById("login-error").style.display = "block";
        }
    });
}

function settaSessione(utente) {
    // Salviamo i dati per la UI
    sessionStorage.setItem("utente", JSON.stringify(utente));
    
    // Settiamo il cookie di 10 minuti (600.000 ms)
    const d = new Date();
    d.setTime(d.getTime() + 600000);
    document.cookie = `sessione_attiva=true;expires=${d.toUTCString()};path=/`;

    mostraAreaPrivata();
}

function controllaAccesso() {
    const cookieAttivo = document.cookie.match('(^|;)\\s*sessione_attiva\\s*=\\s*([^;]+)');
    const datiSessione = sessionStorage.getItem("utente");

    if (cookieAttivo && datiSessione) {
        mostraAreaPrivata();
    } else {
        logout();
    }
}

function mostraAreaPrivata() {
    document.getElementById("vista-login").style.display = "none";
    document.getElementById("area-privata").style.display = "block";
    getTodo();
}

function mostraUser() {
  document.getElementById("vista-login").style.display = "none";

  const datiSessione = JSON.parse(sessionStorage.getItem("utente"));

  if (
    datiSessione.name === "diego" &&
    datiSessione.email === "diego.bernini@itispaleocapa.it" &&
    datiSessione.surname === "bernini"
  ) {
    document.getElementById("user-list").style.display = "block";
    alert("Funzione non implementata, ma se vuoi puoi vedere i dati nella console");
  } else {
    document.getElementById("user-list").style.display = "none";
    alert("Non hai i permessi per accedere alla lista degli utenti");
  }
}


function logout() {
    sessionStorage.clear();
    document.cookie = "sessione_attiva=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.getElementById("vista-login").style.display = "block";
    document.getElementById("area-privata").style.display = "none";
    document.getElementById("user-list").style.display = "none";
}


// TODO 
async function getTodo() {
  try {
    const response = await fetch(API_TODO);
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }
    const todos = await response.json();
    
    console.log("Dati vecchi:", arrayElementiASchermo);
    console.log("Dati ricevuti:", todos);

    if (timerPolling) clearTimeout(timerPolling); // Pulisce il timer precedente se esiste
    timerPolling = setTimeout(() => {
      const cookieAttivo = document.cookie.match('(^|;)\\s*sessione_attiva\\s*=\\s*([^;]+)');
      const datiSessione = sessionStorage.getItem("utente");

      if (cookieAttivo && datiSessione) {
          getTodo();
      } else {
          logout();
      }
    }, 10000); // Polling ogni 10 secondi


    popolaSchermata(todos);

  } catch (error) {
    console.error("Errore fetch:", error);
    document.getElementById("todo-list").innerHTML = "<li>Errore nel caricamento dei dati</li>";
  }
}

async function deleteTodo(id) {
    const response = await fetch(API_TODO + "/" + id, {
        method: 'DELETE',
        headers: {
            'accept': '*/*'
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return;
}

function ottieni_modifiche(new_array){
  let eliminati =[];
  let aggiunti =[];
  let modificati =[];

  // Controlla eliminati e modificati
  arrayElementiASchermo.forEach(todoArrVecchio => {
    const todoArrNuovo = new_array.find(item => item.id === todoArrVecchio.id);
    if (!todoArrNuovo) {
      eliminati.push(todoArrVecchio);
    } else if (JSON.stringify(todoArrNuovo) !== JSON.stringify(todoArrVecchio)) {
      modificati.push(todoArrNuovo);
    }
  });

  // Controlla aggiunti
  new_array.forEach(todoArrNuovo => {
      const todoArrVecchio = arrayElementiASchermo.find(item => item.id === todoArrNuovo.id);
      if (!todoArrVecchio) {
        aggiunti.push(todoArrNuovo);
      }
  });

  console.log("Eliminati:", eliminati);
  console.log("Aggiunti:", aggiunti);
  console.log("Modificati:", modificati);

  return { eliminati, aggiunti, modificati };
}

// Funzione per mostrare i todo in pagina
function popolaSchermata(todos) {
  const lista = document.getElementById("todo-list");

  const modifiche = ottieni_modifiche(todos); // Ottiene le modifiche rispetto all'array precedente
  arrayElementiASchermo = todos; // Aggiorna l'array con i nuovi dati

  modifiche.eliminati.forEach(todo => {
    const li = document.querySelector(`li[data-id="${todo.id}"]`);
    if (li) li.remove();
  });

  modifiche.modificati.forEach(todo => {
    const li = document.querySelector(`li[data-id="${todo.id}"]`);
    if (li) {
      li.textContent = todo.name;
      li.className = todo.isComplete ? "complete" : "incomplete";
    }
  });

  modifiche.aggiunti.forEach(todo => {
    const li = document.createElement("li");
    li.className = todo.isComplete ? "complete" : "incomplete";
    li.dataset.id = todo.id;

    const span = document.createElement("span");
    span.textContent = todo.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", () => {
      deleteTodo(todo.id).catch(console.error);
      getTodo(); // Ricarica la lista dopo l'eliminazione
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    lista.appendChild(li);
  });
}

//AVVIO
controllaAccesso();