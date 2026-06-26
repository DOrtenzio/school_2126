/*
Dopo aver implementato la parte di BACKEND per la gestione dell'API rest sulla risorsa user
Sviluppa la parte FRONTEND in modo tale che:

----------- FATTI -----------
- l'utente possa identificarsi attraverso name e mail
se l'utente è stato riconosciuto per 10 minuti avrà accesso alla/e pagina/e per la gestione dei todos
- tenere aggiornati i todos ad intervalli di tempo di 10 secondi (versione avanzata aggiornando solamente i todos che hanno subito modifiche)
- Solo se sei loggato come Diego Bernini avrai la possibilità di gestire (CRUD) gli utenti.
- modificare i todos (versione avanzata permettendone il ripristino)



----------- DA FARE -----------
- mostrare i todos (versione avanzata paginati e filtrabili/ordinabili utilizzando chart.js)
- eliminare i todos (versione avanzata: selezionandone anche più di uno e permettendone il ripristino)
*/

const API_TODOS = "https://silver-robot-q7pq7rgj6jgx394j6-5004.app.github.dev/todo";
const API_USERS = "https://silver-robot-q7pq7rgj6jgx394j6-5004.app.github.dev/user";

//  variabili di stato 
let todo_arr = []; 
let undo_bucket = [];
let utenti_arr = [];
let timerPolling = null;
let timerLoginSessione = null;
let popup = null;
let notifica = null;

document.addEventListener('DOMContentLoaded', () => {
    popup = new bootstrap.Modal(document.getElementById('infoModal'));
    notifica = new bootstrap.Toast(document.getElementById('liveToast'));
});

// Interfaccia grafica
function mostraNotifica(message, isError = false) {
    const p = document.getElementById('liveToast');
    const corpo = document.getElementById('toastMessage');
    corpo.textContent = message;
    
    if (isError) {
        p.classList.remove('text-bg-success');
        p.classList.add('text-bg-danger');
    } else {
        p.classList.remove('text-bg-danger');
        p.classList.add('text-bg-success');
    }
    notifica.show();
}

function mostraPopUp(title, text) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').textContent = text;
    popup.show();
}

// Recupero undo bucket
if (sessionStorage.getItem("undo_bucket")) {
    undo_bucket = JSON.parse(sessionStorage.getItem("undo_bucket"));
}

// GESTIONE LOGIN 
function effettuaLogin(event) {
    if(event) event.preventDefault();
    const nomeInserito = document.getElementById("login-nome").value.toLowerCase().trim();
    const emailInserita = document.getElementById("login-email").value.toLowerCase().trim();
    const errorDiv = document.getElementById("login-error");

    fetch(API_USERS)
    .then(res => res.json())
    .then(utenti => {
        const utenteTrovato = utenti.find(u => 
            u.name.toLowerCase() === nomeInserito && 
            u.email.toLowerCase() === emailInserita
        );

        if (utenteTrovato) {
            const isAdmin = (utenteTrovato.name.toLowerCase() === "diego" && utenteTrovato.surname.toLowerCase() === "bernini");
            errorDiv.style.display = "none"; //per sicurezza
            inizializzaCookie(utenteTrovato.name, utenteTrovato.email, isAdmin);
        } else {
            errorDiv.style.display = "block";
        }
    })
    .catch(err => {
        console.error(err);
        alert("Errore di connessione al server");
    });
}

function inizializzaCookie(nome, email, isAdmin) {
    const datiUtente = { nome, email, isAdmin };
    sessionStorage.setItem("utente", JSON.stringify(datiUtente));
    setCookie("sessione_attiva", "true", 600000);
    gestisciInterfaccia(datiUtente);
}

function controllaCookie() {
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const cookieAttivo = getCookie("sessione_attiva");

    if (datiSessione && cookieAttivo) {
        gestisciInterfaccia(datiSessione);
        
        if (!timerLoginSessione) {
            timerLoginSessione = setTimeout(() => {
                mostraPopUp("Sessione Scaduta", "La tua sessione è terminata per inattività.");
                logout();
            }, 600000); 
        }
    } else if (datiSessione && !cookieAttivo) {
        logout();
    }
}

function setCookie(nome, valore, secondi) {
    const d = new Date();
    d.setTime(d.getTime() + (secondi * 1000));
    document.cookie = `${nome}=${valore};expires=${d.toUTCString()};path=/`;
}

function getCookie(nome) {
    const valore = document.cookie.match('(^|;)\\s*' + nome + '\\s*=\\s*([^;]+)');
    return valore ? valore.pop() : null;
}

function logout() {
    sessionStorage.clear();
    document.cookie = "sessione_attiva=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; 
    clearTimeout(timerLoginSessione); 
    clearInterval(timerPolling); 
    location.reload();
}

function gestisciInterfaccia(datiUtente) {
    const loginDiv = document.getElementById("vista-login");
    loginDiv.className = "d-none"; 
    loginDiv.style.display = "none"; 

    document.getElementById("navbar-principale").style.display = "flex";
    document.getElementById("info-utente").textContent = `Ciao, ${datiUtente.nome}`;
    
    mostraVistaTodos();

    if (datiUtente.isAdmin) {
        document.getElementById("btn-admin-users").style.display = "block";
    } else {
        document.getElementById("btn-admin-users").style.display = "none";
    }
}

function mostraVistaTodos() {
    document.getElementById("vista-todos").style.display = "block";
    document.getElementById("vista-utenti").style.display = "none";
    
    getTodo();
    if (!timerPolling) {
        timerPolling = setInterval(getTodo, 10000); 
    }
}

function mostraVistaUtenti() {
    document.getElementById("vista-todos").style.display = "none";
    document.getElementById("vista-utenti").style.display = "block";
    caricaUtenti();
}

// TODOS (CRUD e UNDO + POLLING) 

function getTodo(id = null) {
    const url = id ? `${API_TODOS}/${id}` : API_TODOS;
    return fetch(url)
        .then(res => res.ok ? res.json() : [])
        .then(result => {
            if (id === null) {
                const dati = Array.isArray(result) ? result : [];
                popolaCardTodos(dati);
            }
            return result;
        })
        .catch(err => console.error("Errore fetch todos:", err));
}

function popolaCardTodos(new_array) {
    const contenitore = document.getElementById("contenitore-todos");
    const template = document.getElementById("template-todo");
    
    const { da_aggiornare, da_rimuovere, nuovi } = ottieni_differenze_todos(new_array);

    if (contenitore.children.length === 0) { 
        new_array.forEach(todo => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".card");
            contenutoCard(card, todo);
            contenitore.appendChild(clone);
        });
    } else {
        da_rimuovere.forEach(t => {
            const cardWrapper = contenitore.querySelector(`[data-id-card="${t.id}"]`)?.parentElement;
            if (cardWrapper) cardWrapper.remove();
        });

        nuovi.forEach(t => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".card");
            contenutoCard(card, t);
            card.classList.add('border-warning');
            setTimeout(() => card.classList.remove('border-warning'), 6000);
            contenitore.appendChild(clone);
        });

        da_aggiornare.forEach(t => {
            const card = contenitore.querySelector(`[data-id-card="${t.id}"]`);
            if (card) {
                contenutoCard(card, t);
                card.classList.add('border-warning');
                setTimeout(() => card.classList.remove('border-warning'), 6000);
            }
        });
    }

    todo_arr = new_array;
    sessionStorage.setItem("undo_bucket", JSON.stringify(undo_bucket));
}

function contenutoCard(card, todo) {
    card.dataset.idCard = todo.id;
    
    const titolo = card.querySelector(".nome");
    titolo.textContent = todo.name;
    
    card.querySelector(".id-badge").textContent = `#${todo.id}`;
    
    const check = card.querySelector(".isComplete");
    check.checked = todo.isComplete;
    
    if(todo.isComplete) {
        titolo.classList.add('Completo');
        titolo.classList.remove('Incompleto');
    } else {
        titolo.classList.add('Incompleto');
        titolo.classList.remove('Completo');
    }

    card.querySelector(".cancella").onclick = () => cancellaTodo(todo.id);
    
    card.querySelector(".vedi-dettaglio").onclick = () => {
        getTodo(todo.id).then(datiSingoli => {
            const testo = JSON.stringify(datiSingoli, null, 2)
                .replace(/{|}|"/g, '') 
                .trim();
            mostraPopUp("Dettagli Attività", testo);
        });
    };
    
    const btnModifica = card.querySelector(".modifica");
    const boxModifica = card.querySelector(".modificaBox");
    
    btnModifica.onclick = () => {
        if(boxModifica.style.display === 'none') {
            boxModifica.style.display = 'block';
            boxModifica.querySelector('[name="nome"]').value = todo.name;
            boxModifica.querySelector('[name="isComplete"]').checked = todo.isComplete;
        } else {
            boxModifica.style.display = 'none';
        }
    };

    boxModifica.onsubmit = (e) => modificaTodo(e, todo.id);
}

function ottieni_differenze_todos(new_arr) {
    let nuovi = new_arr.filter(n => !todo_arr.find(v => v.id === n.id));
    let da_aggiornare = new_arr.filter(n => {
        const vecchio = todo_arr.find(v => v.id === n.id);
        return vecchio && JSON.stringify(vecchio) !== JSON.stringify(n);
    });
    let da_rimuovere = todo_arr.filter(v => !new_arr.find(n => n.id === v.id));
    return { da_aggiornare, da_rimuovere, nuovi };
}

//  CRUD OPERAZIONI 
function aggiungiTodo(event, obj = null) {
    if (event) event.preventDefault();
    const form = document.getElementById("form-add-todo");

    const data = obj || {
        name: form.querySelector('[name="nome"]').value,
        isComplete: form.querySelector('[name="isComplete"]').checked,
        categoryId: 1,
        listId: 1
    };

    fetch(API_TODOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(nuovo => {
        if (!obj) {
            undo_bucket.push({ type: "add", data: nuovo });
            form.reset();
            mostraNotifica("Attività aggiunta con successo!");
            modificaVistaAggiuntaTodo(); 
        }
        getTodo();
    })
    .catch(err => console.error(err));
}

function modificaTodo(event, id, obj = null) {
    if (event) event.preventDefault();
    
    const card = document.querySelector(`[data-id-card="${id}"]`);
    let data;

    if (obj) {
        data = obj;
    } else {
        const box = card.querySelector('.modificaBox');
        data = {
            id: id,
            name: box.querySelector('[name="nome"]').value,
            isComplete: box.querySelector('[name="isComplete"]').checked,
            categoryId: 1,
            listId: 1
        };

        const vecchio = { ...todo_arr.find(t => t.id === id) }; 
        undo_bucket.push({ type: "update", data: vecchio });
    }

    fetch(`${API_TODOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(() => {
        if(!obj && card) card.querySelector('.modificaBox').style.display = 'none'; 
        mostraNotifica("Attività modificata");
        getTodo();
    });
}

function cancellaTodo(id, isUndo = false) {
    if (!isUndo) {
        const daSalvare = { ...todo_arr.find(t => t.id === id) };
        if(daSalvare) undo_bucket.push({ type: "delete", data: daSalvare });
    }

    fetch(`${API_TODOS}/${id}`, { method: "DELETE" })
        .then(() => {
            if(!isUndo) mostraNotifica("Attività eliminata", true);
            getTodo();
        })
        .catch(err => console.error(err));
}

function eseguiUndo() {
    if (undo_bucket.length === 0) return mostraNotifica("Nulla da annullare", true);
    const azione = undo_bucket.pop();

    switch (azione.type) {
        case "add": 
            cancellaTodo(azione.data.id, true); 
            break;
        case "delete": 
            aggiungiTodo(null, azione.data); 
            break;
        case "update": 
            modificaTodo(null, azione.data.id, azione.data); 
            break;
    }
    mostraNotifica("Operazione annullata");
}

function modificaVistaAggiuntaTodo() {
    const f = document.getElementById("form-todo-container");
    if (f.style.display === 'none') {
        f.style.display = 'block';
        f.classList.add('fade-in');
    } else {
        f.style.display = 'none';
    }
}

//  GESTIONE UTENTI  

function caricaUtenti() {
    fetch(API_USERS)
    .then(res => res.json())
    .then(new_users => {
        const contenitore = document.getElementById("contenitore-utenti");
        const template = document.getElementById("template-user");

        let nuovi = new_users.filter(n => !utenti_arr.find(v => v.id === n.id));
        let da_rimuovere = utenti_arr.filter(v => !new_users.find(n => n.id === v.id));
        let da_aggiornare = new_users.filter(n => {
            const vecchio = utenti_arr.find(v => v.id === n.id);
            return vecchio && JSON.stringify(vecchio) !== JSON.stringify(n);
        });

        if (contenitore.children.length === 0) {
            new_users.forEach(u => creaCardUtente(u, template, contenitore));
        } else {
            da_rimuovere.forEach(u => {
                const cardWrapper = contenitore.querySelector(`[data-id-user="${u.id}"]`)?.closest('.col-md-6');
                if (cardWrapper) cardWrapper.remove();
            });

            nuovi.forEach(u => creaCardUtente(u, template, contenitore));

            da_aggiornare.forEach(u => {
                const card = contenitore.querySelector(`[data-id-user="${u.id}"]`);
                if (card) {
                    aggiornaDatiUtenteCard(card, u);
                    card.classList.add('border-primary'); 
                    setTimeout(() => card.classList.remove('border-primary'), 2000);
                }
            });
        }
        utenti_arr = new_users;
    });
}

function creaCardUtente(u, template, contenitore) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    card.dataset.idUser = u.id;
    
    aggiornaDatiUtenteCard(card, u);

    const infoView = card.querySelector(".info-view");
    const editView = card.querySelector(".edit-view");
    const btnEditToggle = card.querySelector(".btn-edit-toggle");

    btnEditToggle.onclick = () => {
        if (editView.style.display === "none") {
            editView.style.display = "block";
            infoView.style.display = "none";
            card.querySelector(".edit-name").value = u.name;
            card.querySelector(".edit-surname").value = u.surname;
            card.querySelector(".edit-email").value = u.email;
        } else {
            editView.style.display = "none";
            infoView.style.display = "block";
        }
    };

    card.querySelector(".save-user-edit").onclick = () => {
        const body = {
            name: card.querySelector(".edit-name").value,
            surname: card.querySelector(".edit-surname").value,
            email: card.querySelector(".edit-email").value
        };
        
        fetch(`${API_USERS}/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(res => {
            if(res.ok) {
                showToast("Utente aggiornato!");
                caricaUtenti(); // Ricarica la lista
            }
        });
    };

    card.querySelector(".vedi-dettaglio-utente").onclick = () => {
        getUtente(u.id).then(datiSingoli => {
            const testo = 
                `ID: ${datiSingoli.id}\n` +
                `Nome: ${datiSingoli.name}\n` +
                `Cognome: ${datiSingoli.surname}\n` +
                `Email: ${datiSingoli.email}`;
            mostraPopUp("Scheda Utente", testo);
        });
    };

    const btnElimina = card.querySelector(".elimina-utente");
    btnElimina.onclick = () => eliminaUtente(u.id);
    
    contenitore.appendChild(clone);
}

function aggiornaDatiUtenteCard(card, u) {
    card.querySelector(".card-title").textContent = `${u.name} ${u.surname}`;
    card.querySelector(".email-text").textContent = u.email;
}

function getUtente(id) {
    return fetch(`${API_USERS}/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Errore nel recupero utente");
            return res.json();
        })
        .catch(err => console.error(err));
}

function aggiungiUtente() {
    const form = document.getElementById("vista_aggiunta_utente");
    const name = form.querySelector('[name="name"]').value;
    const surname = form.querySelector('[name="surname"]').value;
    const email = form.querySelector('[name="email"]').value;

    if(!name || !surname || !email) return mostraNotifica("Compila tutti i campi", true);

    const body = { name, surname, email };

    fetch(API_USERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(res => {
        if(res.ok) {
            form.reset();
            form.style.display = "none";
            mostraNotifica("Utente creato con successo");
            caricaUtenti();
        }
    });
}

function eliminaUtente(id) {
    const utente = utenti_arr.find(u => u.id === id);
    const nomeDaMostrare = utente ? `${utente.name} ${utente.surname}` : "questo utente";

    if (!confirm(`Sei sicuro di voler eliminare ${nomeDaMostrare}?`)) return; 

    fetch(`${API_USERS}/${id}`, {
        method: 'DELETE',
        headers: { 
            'Authorization': 'Bearer 5IDtoken',
            'accept': '*/*' 
        }
    })
    .then(res => {
        if (res.ok) {
            mostraNotifica("Utente eliminato");
            caricaUtenti();
        } else {
            mostraNotifica("Errore durante l'eliminazione", true);
        }
    })
    .catch(err => console.error("Errore:", err));
}

function vista_aggiunta_utente() {
    const form = document.getElementById("vista_aggiunta_utente");
    if (form.style.display === "none") {
        form.style.display = "block";
        form.classList.add('fade-in');
    } else {
        form.style.display = "none";
    }
}

//GENERALE
window.addEventListener('keydown', e => { 
    if(e.ctrlKey && e.key === 'z') eseguiUndo(); 
});

controllaCookie();