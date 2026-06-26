const API_TODOS = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/todo";
const API_USERS = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/user";

let todo_arr = []; 
let todo_filtrati_arr = [];
let undo_bucket = [];
let utenti_arr = [];
let timerPolling = null;
let timerLoginSessione = null;
let popup = null;
let notifica = null;
let isFirstPhaseCM=true;
let paginaCorrente = 1;
const elementiPerPagina = 5;
let graficoStato = null;
let graficoCategorie = null;
let n=10;

document.addEventListener('DOMContentLoaded', () => {
    popup = new bootstrap.Modal(document.getElementById('infoModal'));
    notifica = new bootstrap.Toast(document.getElementById('liveToast'));
});

function mostraNotifica(message, isError = false) {
    const p = document.getElementById('liveToast');
    const corpo = document.getElementById('toastMessage');
    corpo.innerHTML = message;
    
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

function loginForm(event) {
    if(event) event.preventDefault();
    const nomeInserito = document.getElementById("login-nome").value.toLowerCase().trim();
    const emailInserita = document.getElementById("login-email").value.toLowerCase().trim();
    const errorDiv = document.getElementById("login-error");

    console.log("Login di :"+nomeInserito+" email: "+emailInserita);

    fetch(API_USERS + "/byemail/" + encodeURIComponent(emailInserita))
    .then(res => {
        if (!res.ok) { throw new Error("Utente non trovato o dati non validi"); }
        return res.json();
    })
    .then(utente => {
        console.log("Dbg=> Ricevuto:" + JSON.stringify(utente));

        if (utente.name.toLowerCase() === nomeInserito.toLowerCase()) {
            const isAdmin = (utente.name.toLowerCase() === "diego" && utente.surname?.toLowerCase() === "bernini");
            errorDiv.style.display = "none";
            settaCookieSessione(utente.name, utente.email, isAdmin);
        } else {
            errorDiv.style.display = "block";
        }
    })
    .catch(error => {
        console.error("Errore durante la fetch:", error);
        errorDiv.style.display = "block";
    });
}

function settaCookieSessione(nome, email, isAdmin) {
    const datiUtente = { nome, email, isAdmin };
    sessionStorage.setItem("utente", JSON.stringify(datiUtente));
    const scadenza = Date.now() + 600000;
    sessionStorage.setItem("scadenza_sessione", scadenza);
    setCookie("sessione_attiva", "true", 600000);
    console.log("Dbg=> Set cookie per timer e var di sessione con info utente");
    gestisciInterfaccia(datiUtente);
    avviaTimerSessione();
}

function avviaTimerSessione() {
    if (timerLoginSessione) clearInterval(timerLoginSessione);
    timerLoginSessione = setInterval(() => {
        const fineSessione = sessionStorage.getItem("scadenza_sessione");
        if (!fineSessione) {
            logout();
            return;
        }
        const millisecondiMancanti = fineSessione - Date.now();
        let secondiRimanenti = Math.floor(millisecondiMancanti / 1000);
        if (secondiRimanenti <= 0) {
            clearInterval(timerLoginSessione);
            mostraNotifica("Sessione scaduta!");
            logout();
            return;
        }
        const min = Math.floor(secondiRimanenti / 60);
        const sec = secondiRimanenti % 60;
        const display = document.getElementById("session-timer");
        if (display) {
            display.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function controllaCookie() {
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const cookieAttivo = getCookie("sessione_attiva");
    if (datiSessione && cookieAttivo) {
        gestisciInterfaccia(datiSessione);
        avviaTimerSessione(); 
    } else if (datiSessione && !cookieAttivo) {
        logout();
    }
}

function setCookie(nome, valore, secondi) {
    const d = new Date();
    d.setTime(d.getTime() + (secondi));
    document.cookie = `${nome}=${valore};expires=${d.toUTCString()};path=/`;
}

function getCookie(nome) {
    console.log("Ricerco Cookie:", nome, " Cookie: ", document.cookie);
    const valore = document.cookie.match('(^|;)\\s*' + nome + '\\s*=\\s*([^;]+)');
    return valore ? valore.pop() : null;
}

function logout() {
    sessionStorage.clear();
    document.cookie = "sessione_attiva=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; 
    clearInterval(timerLoginSessione); 
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
    getTodoConLog();
    if (timerPolling) clearInterval(timerPolling);
    timerPolling = setInterval(async () => {
        if (!getCookie("sessione_attiva")) {
            console.log("Sessione scaduta rilevata dal polling.");
            logout();
        } else {
            const ciSonoModifiche = await checkModifiche();
            if (ciSonoModifiche) {
                console.log("Modifiche rilevate! Aggiorno i dati...");
                await getTodoConLog();
            } else {
                console.log("Nessuna modifica, continuo il polling...");
            }
        }
    }, 10000); 
}

function mostraVistaUtenti() {
    let datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    if (!datiSessione.isAdmin) {
        document.getElementById("btn-admin-users").style.display = "none";
        mostraNotifica("Non fare il furbo non sei autorizzato.",true);
    } else {
        document.getElementById("vista-todos").style.display = "none";
        document.getElementById("vista-utenti").style.display = "block";
        caricaUtenti();
        if (timerPolling) clearInterval(timerPolling);
        timerPolling = setInterval(() => {
            if (!getCookie("sessione_attiva")) {
                logout();
            } else {
                caricaUtenti();
            }
        }, 10000);
    }
}

async function getTodoConLog() {
    try {
        const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
        const nomeUtente = datiSessione.nome;
        const response = await fetch(`${API_TODOS}/log/${nomeUtente}`);
        if (!response.ok) throw new Error(`Errore nella richiesta: ${response.status}`);
        const result = await response.json();
        const dati = Array.isArray(result) ? result : [];
        popolaCardTodos(dati, true);
    } catch (error) {
        console.error("Errore fetch getTodoConLog:", error);
    }
}

async function checkModifiche() {
    try {
        const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
        const nomeUtente = datiSessione.nome;
        const response = await fetch(`${API_TODOS}/ismodificato/${nomeUtente}`);
        if (!response.ok) throw new Error(`Errore nella richiesta: ${response.status}`);
        const isModificato = await response.json();
        return isModificato;
    } catch (error) {
        console.error("Errore fetch checkModifiche:", error);
        return false;
    }
}

function getTodo(id = null) {
    console.log("gett");
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    const url = id ? `${API_TODOS}/log/${nomeUtente}/${id}` : `${API_TODOS}/log/${nomeUtente}`;
    return fetch(url)
        .then(res => res.ok ? res.json() : [])
        .then(result => {
            if (id === null) {
                const dati = Array.isArray(result) ? result : [];
                popolaCardTodos(dati,true);
                return;
            }
            return result;
        })
        .catch(err => console.error("Errore fetch todos:", err));
}

function popolaCardTodos(new_array, usaEffetti = true) {
    const filtroAttivo = getCookie('filtro_selected') || 'all';
    todo_filtrati_arr = new_array.filter(todo => {
        if (filtroAttivo === 'complete') return todo.isComplete === true;
        if (filtroAttivo === 'incomplete') return todo.isComplete === false;
        if (filtroAttivo.startsWith('cat')) {
            const catId = filtroAttivo.replace('cat', '');
            return todo.categoryId == catId;
        }
        return true; 
    });
    const indiceInizio = (paginaCorrente - 1) * elementiPerPagina; 
    const indiceFine = indiceInizio + elementiPerPagina;
    const datiDaMostrareInPagina = todo_filtrati_arr.slice(indiceInizio, indiceFine);
    const contenitore = document.getElementById("contenitore-todos");
    const template = document.getElementById("template-todo");
    if(contenitore.children.length === 0){
        contenitore.innerHTML = "";
        datiDaMostrareInPagina.forEach(t => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".card");
            contenutoCard(card, t);
            contenitore.appendChild(clone);
        });
        aggiornaGrafico(todo_filtrati_arr);
    } else {
        const { da_aggiornare, da_rimuovere, nuovi } = ottieni_differenze_mirate(datiDaMostrareInPagina, contenitore);
        da_rimuovere.forEach(id => {
            const card = contenitore.querySelector(`[data-id-card="${id}"]`);
            if (card) card.closest('.col-md-6')?.remove();
        });
        nuovi.forEach(t => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".card");
            contenutoCard(card, t);
            if (usaEffetti) {
                card.classList.add('border-warning');
                setTimeout(() => card.classList.remove('border-warning'), 3000);
            }
            contenitore.appendChild(clone);
        });
        da_aggiornare.forEach(t => {
            const card = contenitore.querySelector(`[data-id-card="${t.id}"]`);
            if (card){ 
                contenutoCard(card, t);
                if (usaEffetti) {
                    card.classList.add('border-info');
                    setTimeout(() => card.classList.remove('border-info'), 3000);
                }
            } else
                mostraNotifica(`Errore: Impossibile trovare la card da aggiornare per todo ID ${t.id}`, true);
        });
    }
    aggiornaNumeriPaginazione();
    todo_arr = new_array; 
    if(n>0){ 
        n--;
        console.log("Polling... cicli mancanti prima di aggiornamento grafico: "+n);
    }else if (n === 0) {
        console.log("Aggiornamento grafico dopo 10 cicli di polling");
        aggiornaGrafico(todo_filtrati_arr);
        n=10;
    }
}

function contenutoCard(card, todo) {
    card.dataset.idCard = todo.id;
    const titolo = card.querySelector(".nome");
    titolo.textContent = todo.name;
    card.querySelector(".id-badge").textContent = `#${todo.id}`;
    const check = card.querySelector(".isComplete");
    check.checked = todo.isComplete;
    const checkM = card.querySelector(".delete-check");
    checkM.dataset.idCardm=todo.id;
    card.querySelector(".cat-badge").textContent = `Cat: ${todo.categoryId}`;
    card.querySelector(".list-badge").textContent = `List: ${todo.listId}`;
    if(todo.isComplete) {
        titolo.classList.add('Completo');
        titolo.classList.remove('Incompleto');
    } else {
        titolo.classList.add('Incompleto');
        titolo.classList.remove('Completo');
    }
    const form = card.querySelector('.modificaBox');
    form.querySelector('[name="nome"]').value = todo.name;
    form.querySelector('[name="isComplete"]').checked = todo.isComplete;
    form.querySelector('[name="categoryId"]').value = todo.categoryId;
    form.querySelector('[name="listId"]').value = todo.listId;
    const btnModifica = card.querySelector('.modifica');
    btnModifica.onclick = () => {
        const formAttivo = card.querySelector('.modificaBox');
        if (formAttivo.style.display === 'none' || formAttivo.style.display === '') {
            formAttivo.style.display = 'block';
            card.querySelector('.pulsantiera').style.display = 'none';
        } else {
            formAttivo.style.display = 'none';
            card.querySelector('.pulsantiera').style.display = 'flex';
        }
    };
    form.onsubmit = (e) => {
        e.preventDefault();
        const nome = form.querySelector('[name="nome"]').value;
        const isComplete = form.querySelector('[name="isComplete"]').checked;
        const categoryId = parseInt(form.querySelector('[name="categoryId"]').value);
        const listId = parseInt(form.querySelector('[name="listId"]').value);
        undo_bucket.push({
            action: 'update',
            id: todo.id,
            oldData: { ...todo }
        });
        modificaTodo(todo.id, { id: todo.id, name: nome, isComplete, categoryId, listId });
    };
    const btnCancella = card.querySelector('.cancella');
    btnCancella.onclick = () => cancellaTodo(todo.id);
    const btnDettaglio = card.querySelector('.vedi-dettaglio');
    btnDettaglio.onclick = () => {
        getTodo(todo.id).then(todoCompleto => {
            const testo = `ID: ${todoCompleto.id}\nNome: ${todoCompleto.name}\nCompletato: ${todoCompleto.isComplete ? 'Sì' : 'No'}\nCategoria: ${todoCompleto.categoryId}\nLista: ${todoCompleto.listId}`;
            mostraPopUp("Dettaglio Todo", testo);
        });
    };
}

function ottieni_differenze_mirate(arrNuovo, contenitore) {
    const idsContenitore = Array.from(contenitore.querySelectorAll('[data-id-card]')).map(el => parseInt(el.dataset.idCard));
    const idsNuovi = arrNuovo.map(t => t.id);
    const da_rimuovere = idsContenitore.filter(id => !idsNuovi.includes(id));
    const nuovi = arrNuovo.filter(t => !idsContenitore.includes(t.id));
    const da_aggiornare = arrNuovo.filter(t => {
        if (!idsContenitore.includes(t.id)) return false;
        const vecchio = todo_arr.find(old => old.id === t.id);
        return vecchio && JSON.stringify(vecchio) !== JSON.stringify(t);
    });
    return { da_aggiornare, da_rimuovere, nuovi };
}

function modificaTodo(id, body) {
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    fetch(`${API_TODOS}/${nomeUtente}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(res => {
        if (res.ok) {
            mostraNotifica("Todo aggiornato!");
            const card = document.querySelector(`[data-id-card="${id}"]`);
            if (card) {
                card.querySelector('.modificaBox').style.display = 'none';
                card.querySelector('.pulsantiera').style.display = 'flex';
            }
        } else {
            mostraNotifica("Errore nell'aggiornamento", true);
        }
    })
    .catch(err => console.error("Errore modifica:", err));
}

function cancellaTodo(id) {
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    const todoEliminato = todo_arr.find(t => t.id === id);
    undo_bucket.push({
        action: 'delete',
        data: todoEliminato
    });
    fetch(`${API_TODOS}/${nomeUtente}/${id}`, {
        method: 'DELETE',
        headers: { 'accept': '*/*' }
    })
    .then(res => {
        if (res.ok) {
            mostraNotifica("Todo eliminato!");
        } else {
            mostraNotifica("Errore durante l'eliminazione", true);
        }
    })
    .catch(err => console.error("Errore eliminazione:", err));
}

function cancellaMultiploTodo() {
    const checkboxes = document.querySelectorAll('.delete-check:checked');
    if (checkboxes.length === 0) {
        mostraNotifica("Nessun todo selezionato", true);
        return;
    }
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.idCardm));
    const todosEliminati = ids.map(id => todo_arr.find(t => t.id === id)).filter(Boolean);
    undo_bucket.push({
        action: 'delete_multiple',
        data: todosEliminati
    });
    const promises = ids.map(id => 
        fetch(`${API_TODOS}/${nomeUtente}/${id}`, {
            method: 'DELETE',
            headers: { 'accept': '*/*' }
        })
    );
    Promise.all(promises)
    .then(() => {
        mostraNotifica(`${ids.length} todos eliminati!`);
        checkboxes.forEach(cb => cb.checked = false);
    })
    .catch(err => {
        console.error("Errore eliminazione multipla:", err);
        mostraNotifica("Errore durante l'eliminazione", true);
    });
}

function eseguiUndo() {
    if (undo_bucket.length === 0) {
        mostraNotifica("Nessuna azione da annullare", true);
        return;
    }
    const ultimaAzione = undo_bucket.pop();
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    if (ultimaAzione.action === 'delete') {
        const todo = ultimaAzione.data;
        fetch(`${API_TODOS}/${nomeUtente}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo)
        })
        .then(res => {
            if (res.ok) mostraNotifica("Eliminazione annullata!");
        });
    } 
    else if (ultimaAzione.action === 'delete_multiple') {
        const todos = ultimaAzione.data;
        const promises = todos.map(todo => 
            fetch(`${API_TODOS}/${nomeUtente}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todo)
            })
        );
        Promise.all(promises).then(() => mostraNotifica("Eliminazioni annullate!"));
    }
    else if (ultimaAzione.action === 'update') {
        const todo = ultimaAzione.oldData;
        fetch(`${API_TODOS}/${nomeUtente}/${ultimaAzione.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo)
        })
        .then(res => {
            if (res.ok) mostraNotifica("Modifica annullata!");
        });
    }
}

function aggiungiTodo(event) {
    event.preventDefault();
    const form = event.target;
    const nome = form.querySelector('[name="nome"]').value.trim();
    const isComplete = form.querySelector('[name="isComplete"]').checked;
    const categoryId = parseInt(form.querySelector('[name="categoryId"]').value);
    const listId = parseInt(form.querySelector('[name="listId"]').value);
    if (!nome) {
        mostraNotifica("Il nome non può essere vuoto", true);
        return;
    }
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const nomeUtente = datiSessione.nome;
    const body = { name: nome, isComplete, categoryId, listId };
    fetch(`${API_TODOS}/${nomeUtente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(res => {
        if (res.ok) {
            mostraNotifica("Todo aggiunto con successo!");
            form.reset();
        } else {
            mostraNotifica("Errore durante l'aggiunta", true);
        }
    })
    .catch(error => console.error('Errore aggiunta:', error));
}

function modificaVistaAggiuntaTodo() {
    const form = document.getElementById("form-todo-container");
    if (form.style.display === "none") {
        form.style.display = "block";
    } else {
        form.style.display = "none";
    }
}

function gestisciFiltro(valore) {
    setCookie('filtro_selected', valore, 3600000);
    paginaCorrente = 1;
    popolaCardTodos(todo_arr, false);
}

function cambiaPagina(direzione) {
    const totalePagine = Math.ceil(todo_filtrati_arr.length / elementiPerPagina);
    if (direzione === 'next' && paginaCorrente < totalePagine) {
        paginaCorrente++;
    } else if (direzione === 'prev' && paginaCorrente > 1) {
        paginaCorrente--;
    }
    popolaCardTodos(todo_arr, false);
}

function aggiornaNumeriPaginazione() {
    const totalePagine = Math.ceil(todo_filtrati_arr.length / elementiPerPagina);
    const container = document.getElementById("contenitore-todos");
    let navPaginazione = container.parentElement.querySelector('.pagination-nav');
    if (!navPaginazione && totalePagine > 1) {
        navPaginazione = document.createElement('div');
        navPaginazione.className = 'pagination-nav d-flex justify-content-center align-items-center gap-3 mt-4';
        navPaginazione.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" onclick="cambiaPagina('prev')" ${paginaCorrente === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Precedente
            </button>
            <span class="text-muted">Pagina <strong>${paginaCorrente}</strong> di <strong>${totalePagine}</strong></span>
            <button class="btn btn-outline-primary btn-sm" onclick="cambiaPagina('next')" ${paginaCorrente === totalePagine ? 'disabled' : ''}>
                Successiva <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
        container.parentElement.appendChild(navPaginazione);
    } else if (navPaginazione) {
        if (totalePagine <= 1) {
            navPaginazione.remove();
        } else {
            navPaginazione.innerHTML = `
                <button class="btn btn-outline-primary btn-sm" onclick="cambiaPagina('prev')" ${paginaCorrente === 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i> Precedente
                </button>
                <span class="text-muted">Pagina <strong>${paginaCorrente}</strong> di <strong>${totalePagine}</strong></span>
                <button class="btn btn-outline-primary btn-sm" onclick="cambiaPagina('next')" ${paginaCorrente === totalePagine ? 'disabled' : ''}>
                    Successiva <i class="fa-solid fa-chevron-right"></i>
                </button>
            `;
        }
    }
}

function aggiornaGrafico(todos) {
    const completi = todos.filter(t => t.isComplete).length;
    const incompleti = todos.length - completi;
    if (completi === 0 && incompleti === 0) {
        console.log("Nessun todo, non creo grafici");
        return;
    }
    const contestoTorta = document.getElementById('chartStato')?.getContext('2d');
    const contestoBarre = document.getElementById('chartCategorie')?.getContext('2d');
    if (contestoTorta) {
        if (graficoStato) graficoStato.destroy();
        graficoStato = new Chart(contestoTorta, {
            type: 'pie',
            data: {
                labels: ['Completati', 'Da fare'],
                datasets: [{
                    data: [completi, incompleti],
                    backgroundColor: ['#28a745', '#ffc107']
                }]
            },
            options: {
                plugins: { 
                    title: { 
                        display: true, 
                        text: 'Stato dei Todo' 
                    } 
                }
            }
        });
    }
    if (contestoBarre) {
        const conteggioCat = {};
        for (let i = 0; i < todos.length; i++) {
            let categoria = todos[i].categoryId;
            if (conteggioCat[categoria] === undefined) {
                conteggioCat[categoria] = 1;
            } else {
                conteggioCat[categoria]++;
            }
        }
        if (graficoCategorie) graficoCategorie.destroy();
        graficoCategorie = new Chart(contestoBarre, {
            type: 'bar',
            data: {
                labels: Object.keys(conteggioCat).map(id => 'Cat ' + id),
                datasets: [{
                    label: 'Numero Todo',
                    data: Object.values(conteggioCat),
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1 }
                    } 
                },
                plugins: { 
                    title: { 
                        display: true, 
                        text: 'Distribuzione per Categoria' 
                    } 
                }
            }
        });
    }
}

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
            id: u.id,
            name: card.querySelector(".edit-name").value.trim(),
            surname: card.querySelector(".edit-surname").value.trim(),
            email: card.querySelector(".edit-email").value.trim()
        };
        fetch(`${API_USERS}/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(res => {
            if(res.ok) {
                mostraNotifica("Utente aggiornato!");
                editView.style.display = "none";
                infoView.style.display = "block";
                caricaUtenti();
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

window.addEventListener('keydown', e => { 
    if(e.ctrlKey && e.key === 'z') eseguiUndo(); 
});

controllaCookie();