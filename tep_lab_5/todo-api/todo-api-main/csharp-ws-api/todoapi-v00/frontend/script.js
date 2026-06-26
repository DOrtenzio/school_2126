/*
Dopo aver implementato la parte di BACKEND per la gestione dell'API rest sulla risorsa user
Sviluppa la parte FRONTEND in modo tale che:

----------- FATTI -----------
- l'utente possa identificarsi attraverso name e mail
se l'utente è stato riconosciuto per 10 minuti avrà accesso alla/e pagina/e per la gestione dei todos
- tenere aggiornati i todos ad intervalli di tempo di 10 secondi (versione avanzata aggiornando solamente i todos che hanno subito modifiche)
- Solo se sei loggato come Diego Bernini avrai la possibilità di gestire (CRUD) gli utenti.
- modificare i todos (versione avanzata permettendone il ripristino)
- eliminare i todos (versione avanzata: selezionandone anche più di uno e permettendone il ripristino)
- mostrare i todos (versione avanzata paginati e filtrabili/ordinabili utilizzando chart.js)

----------- DA FARE -----------
cp -r ./todoapi-v00/frontend /var/www/html/
git add . && git commit -m "fix" && git push origin main
*/

const API_TODOS = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/todo";
const API_USERS = "https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/user";

//  variabili di stato 
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
    popup = new bootstrap.Modal(document.getElementById('infoModal')); //creo un modale salvato nella var
    notifica = new bootstrap.Toast(document.getElementById('liveToast'));
});

// Interfaccia grafica
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

// GESTIONE LOGIN 
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
        } else { //si email ma no nome
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
    sessionStorage.setItem("utente", JSON.stringify(datiUtente)); // usato per ottenere info per grafica

    const scadenza = Date.now() + 600000;
    sessionStorage.setItem("scadenza_sessione", scadenza);
    setCookie("sessione_attiva", "true", 600000); // utile al refresh per verificare se vi è già accesso

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
        let secondiRimanenti = Math.floor(millisecondiMancanti / 1000); //arrotondo per difetto al secondo più vicino

        if (secondiRimanenti <= 0) {
            clearInterval(timerLoginSessione);
            mostraNotifica("Sessione scaduta!");
            logout();
            return;
        }

        // Aggiornamento cont in alto
        const min = Math.floor(secondiRimanenti / 60);
        const sec = secondiRimanenti % 60;
        const display = document.getElementById("session-timer");
        if (display) {
            display.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function controllaCookie() { //per ricarica pagina
    const datiSessione = JSON.parse(sessionStorage.getItem("utente"));
    const cookieAttivo = getCookie("sessione_attiva");

    if (datiSessione && cookieAttivo) {
        gestisciInterfaccia(datiSessione);
        avviaTimerSessione(); 
    } else if (datiSessione && !cookieAttivo) {
        logout();
    }
}

//gest cookie
function setCookie(nome, valore, secondi) {
    const d = new Date();
    d.setTime(d.getTime() + (secondi));
    document.cookie = `${nome}=${valore};expires=${d.toUTCString()};path=/`; //valido per tutto il sito tanto non cambia
}

function getCookie(nome) {
    console.log("Ricerco Cookie:", nome, " Cookie: ", document.cookie);
    const valore = document.cookie.match('(^|;)\\s*' + nome + '\\s*=\\s*([^;]+)');
    //significato regex
        // (^|;)        → il cookie deve iniziare all'inizio della stringa oppure dopo un punto e virgola
        // \s*          → ignora eventuali spazi prima del nome
        // \s*=\s*      → segno "=" con eventuali spazi prima e dopo
        // ([^;]+)      → cattura il valore del cookie (tutti i caratteri fino al prossimo ";")
    return valore ? valore.pop() : null;
}

function logout() {
    sessionStorage.clear();
    document.cookie = "sessione_attiva=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; 
    clearInterval(timerLoginSessione); 
    clearInterval(timerPolling); 
    location.reload();
}

//INIZIALIZZAZIONE INTERFACCIE
function gestisciInterfaccia(datiUtente) {
    const loginDiv = document.getElementById("vista-login");
    loginDiv.className = "d-none";  //bootstrap con imporatnt
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
    
    getTodo(); //fetch /todo
    if (timerPolling) clearInterval(timerPolling);
    timerPolling = setInterval(() => {
        if (!getCookie("sessione_attiva")) {
            console.log("Sessione scaduta rilevata dal polling.");
            logout(); // Se il cookie è sparito, fermiamo tutto
        } else {
            getTodo(); // Se il cookie c'è, aggiorniamo i dati
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
        }, 10000); // 10 secondi
    }
}

// TODOS (CRUD e UNDO + POLLING) 

function getTodo(id = null) {
    console.log("gett");
    const url = id ? `${API_TODOS}/${id}` : API_TODOS;
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
    const filtroAttivo = getCookie('filtro_selected') || 'all'; //controllo cookie altrimenti tutti se non ancora schiacciato mai menu
    
    todo_filtrati_arr = new_array.filter(todo => {
        if (filtroAttivo === 'complete') return todo.isComplete === true;
        if (filtroAttivo === 'incomplete') return todo.isComplete === false;
        if (filtroAttivo.startsWith('cat')) { //per categoria
            const catId = filtroAttivo.replace('cat', '');
            return todo.categoryId == catId;
        }
        return true; 
    });

    const indiceInizio = (paginaCorrente - 1) * elementiPerPagina; 
    const indiceFine = indiceInizio + elementiPerPagina;
    const datiDaMostrareInPagina = todo_filtrati_arr.slice(indiceInizio, indiceFine); //no incl indice finale

    const contenitore = document.getElementById("contenitore-todos");
    const template = document.getElementById("template-todo");

    if(contenitore.children.length === 0){ // se è la prima volta che popolo o se vuoto non faccio confronto
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

    aggiornaNumeriPaginazione(); //aggiorno numerini sotto
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
            boxModifica.querySelector('[name="categoryId"]').value = todo.categoryId;
            boxModifica.querySelector('[name="listId"]').value = todo.listId;
        } else {
            boxModifica.style.display = 'none';
        }
    };

    boxModifica.onsubmit = (e) => modificaTodo(e, todo.id);
}

function ottieni_differenze_mirate(datiFiltrati, contenitore) {
    const idCardVisibili = Array.from(contenitore.querySelectorAll('.card')).map(c => parseInt(c.dataset.idCard)); //id di quelli attualmente a schermo
    const idCardDaFarVedere = datiFiltrati.map(t => t.id); //id di quelli che dovrei mostrare a schermo

    let da_rimuovere = idCardVisibili.filter(id => !idCardDaFarVedere.includes(id)); //id di quelli presenti a schermo ma non in quelli da mostrare
    let nuovi = datiFiltrati.filter(t => !idCardVisibili.includes(t.id)); // quali da mostrare non vedo a schemro
    let da_aggiornare = datiFiltrati.filter(t => {
        if (!idCardVisibili.includes(t.id)) return false;
        const vecchiaVersione = todo_arr.find(v => v.id === t.id);
        return JSON.stringify(vecchiaVersione) !== JSON.stringify(t);
    });

    return { da_aggiornare, da_rimuovere, nuovi };
}

//  CRUD OPERAZIONI 
function aggiungiTodo(event, obj = null) {
    if (event) event.preventDefault();
    const form = document.getElementById("form-add-todo");

    const data = obj || {
        name: form.querySelector('[name="nome"]').value,
        isComplete: form.querySelector('[name="isComplete"]').checked,
        categoryId: parseInt(form.querySelector('[name="categoryId"]').value),
        listId: parseInt(form.querySelector('[name="listId"]').value)
    };

    fetch(API_TODOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(nuovo => {
        if (!obj) {
            console.log("Nuovo todo aggiunto:", nuovo);
            undo_bucket.push({ type: "add", data: nuovo });
            form.reset();
            mostraNotifica("Attività aggiunta con successo!");
            modificaVistaAggiuntaTodo(); 
        }
        todo_arr.push(nuovo);
        popolaCardTodos(todo_arr);
    })
    .catch(err => console.error(err));
}

function modificaTodo(event, id, obj = null) {
    if (event) event.preventDefault();
    
    const card = document.querySelector(`[data-id-card="${id}"]`);
    let data;

    if (obj) { //undo
        data = obj;
    } else {
        const box = card.querySelector('.modificaBox');
        data = {
            id: id,
            name: box.querySelector('[name="nome"]').value,
            isComplete: box.querySelector('[name="isComplete"]').checked,
            categoryId: parseInt(box.querySelector('[name="categoryId"]').value),
            listId: parseInt(box.querySelector('[name="listId"]').value)
        };

        const vecchio = { ...todo_arr.find(t => t.id === id) };  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        undo_bucket.push({ type: "update", data: vecchio });
    }

    fetch(`${API_TODOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(() => {
        if(!obj && card) card.querySelector('.modificaBox').style.display = 'none'; 
        mostraNotifica("Attività modificata");

        const indice = todo_arr.findIndex(t => t.id === id);
        if (indice !== -1) {
            const vecchioTodo = todo_arr[indice];
            vecchioTodo.name = data.name !== undefined ? data.name : vecchioTodo.name;
            vecchioTodo.isComplete = data.isComplete !== undefined ? data.isComplete : vecchioTodo.isComplete;
            vecchioTodo.categoryId = data.categoryId !== undefined ? data.categoryId : vecchioTodo.categoryId;
            vecchioTodo.listId = data.listId !== undefined ? data.listId : vecchioTodo.listId;
            console.log("Todo aggiornato: ", vecchioTodo, " con dati: ", data);
            popolaCardTodos(todo_arr);
        } else {
            console.error(`Errore: Impossibile trovare il todo con ID ${id} per aggiornare l'array locale.`);
        }
    });
}

function cancellaTodo(id, isUndo = false) {
    if (!isUndo) {
        const daSalvare = { ...todo_arr.find(t => t.id === id) };
        if(daSalvare) undo_bucket.push({ type: "delete", data: daSalvare });
    }

    console.log("Elemento da rimuovere: "+todo_arr);

    fetch(`${API_TODOS}/${id}`, { method: "DELETE" })
    .then(() => {
        if(!isUndo) mostraNotifica("Attività eliminata", true);
        todo_arr = todo_arr.filter(t => t.id !== id);
        popolaCardTodos(todo_arr);
    })
    .catch(err => console.error(err));
}

function cancellaMultiploTodo(){
    const contenitore = document.getElementById("contenitore-todos");
    const bott=document.getElementById("cancMult");
    const allcheck=contenitore.querySelectorAll(".delete-check");
    if(isFirstPhaseCM){
        mostraNotifica("Seleziona I Todo Da Eliminare");
        bott.innerHTML="<i class=\'fa-solid fa-trash\'></i> Conferma";
        allcheck.forEach(check => {
            check.style.display="block";
        });
    }else{
        mostraNotifica("Eliminazione Confermata");
        bott.innerHTML="<i class=\'fa-solid fa-trash\'></i> Cancellazione Multipla";
        const arr_elementi=[];
        //Elimina
        allcheck.forEach(check => {
            if(check.checked){
                const id=check.dataset.idCardm;
                arr_elementi.push({ ...todo_arr.find(t => t.id == id) });
                cancellaTodo(id,true);
            }
        });

        //Undo
        if(arr_elementi.length!==0) undo_bucket.push({ type: "delete-multiple", data: arr_elementi });

        //Ridisattiva tutte le check
        const allcheck_post=contenitore.querySelectorAll(".delete-check");
        allcheck_post.forEach(check => {
            check.style.display="none";
        });
    }

    isFirstPhaseCM=!isFirstPhaseCM;
}

function eseguiUndo() {
    if (undo_bucket.length === 0) return mostraNotifica("Nulla da annullare", true);
    const azione = undo_bucket.pop();

    switch (azione.type) {
        case "add": 
            cancellaTodo(azione.data.id, true); 
            break;
        case "delete": 
            const soloDati = {
                name: azione.data.name,
                isComplete: azione.data.isComplete,
                categoryId: azione.data.categoryId,
                listId: azione.data.listId
            };
            aggiungiTodo(null, soloDati);
            break;
        case "update": 
            modificaTodo(null, azione.data.id, azione.data); 
            break;
        case "delete-multiple":
            if(Array.isArray(azione.data)){
                azione.data.forEach(todorip => {
                    console.log(JSON.stringify(todorip));
                    const soloDati = { //nel salavto nel bucket di undo metto tutto ma per riaggiungere al server mi basta questo
                        name: todorip.name,
                        isComplete: todorip.isComplete,
                        categoryId: todorip.categoryId,
                        listId: todorip.listId
                    };
                    aggiungiTodo(null, soloDati);
                });
            }
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

function gestisciFiltro(opzione){
    setCookie('filtro_selected',opzione,86400);
    paginaCorrente = 1;
    popolaCardTodos(todo_arr,false);
}

function aggiornaNumeriPaginazione() {
    let nav = document.getElementById("nav-paginazione");
    if (!nav) {
        nav = document.createElement("div");
        nav.id = "nav-paginazione";
        nav.className = "d-flex justify-content-center gap-2 mt-4 mb-5";
        document.getElementById("contenitore-todos").after(nav);
    }

    const totalePagine = Math.ceil(todo_filtrati_arr.length / elementiPerPagina);  // Math.ceil arrotonda sempre per eccesso
    nav.innerHTML = ""; 

    for (let i = 1; i <= totalePagine; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `btn btn-sm ${i === paginaCorrente ? 'btn-primary' : 'btn-outline-primary'}`;
        btn.onclick = () => {
            paginaCorrente = i;  // aggiorno la pagina corrente
            popolaCardTodos(todo_arr, false); // ricarico i todo senza effetti e modifico indice inzio in popolaCardTodos
        };
        nav.appendChild(btn);
    }
}

function aggiornaGrafico(todos) {
    const filtroAttivo = getCookie('filtro_selected') || 'all';
    
    //stato = completati e no / brre = cta1 cat2 ect.
    const contestoStato = document.getElementById('chartStato').getContext('2d'); //contesto 2D del canvas per il grafico stato
    const completati = todos.filter(t => t.isComplete).length;
    const incompleti = todos.filter(t => !t.isComplete).length;

    if (graficoStato) graficoStato.destroy(); // Se il grafico esiste già lo distruggo per evitare sovrapposizioni
    graficoStato = new Chart(contestoStato, { //https://www.chartjs.org/docs/latest/getting-started/
        type: 'pie',
        data: {
            labels: ['Fatti', 'Da fare'], //etichetta legenda
            datasets: [{
                data: [completati, incompleti], //dati
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: { 
            plugins: { 
                title: { 
                    display: true, 
                    text: 'Stato Attività'  //titolo grafico
                } 
            } 
        }
    });

    const containerBarre = document.getElementById('containerGraficoBarre');
    if (filtroAttivo.startsWith('cat')) {
        containerBarre.style.display = 'none'; //sarebbe insensato lasciarlo
    } else {
        containerBarre.style.display = 'block';
        const contestoBarre = document.getElementById('chartCategorie').getContext('2d');

        const conteggioCat = {};
        for (let i = 0; i < todos.length; i++) {
            let categoria = todos[i].categoryId; // prendo categoria del todo
            if (conteggioCat[categoria] === undefined) { // se non ho ancora incontrato questa categoria la inizializzo a 1
                conteggioCat[categoria] = 1;
            } else {
                conteggioCat[categoria]++;
            }
        }


        console.log("Categorie: "+conteggioCat);

        if (graficoCategorie) graficoCategorie.destroy();
        graficoCategorie = new Chart(contestoBarre, {
            type: 'bar',
            data: { //etichette asse x e dati asse y
                labels: Object.keys(conteggioCat).map(id => 'Cat ' + id),
                datasets: [{
                    label: 'Numero Todo',
                    data: Object.values(conteggioCat), //array dalle prop del conteggio
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1 } //solo numeri interi
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
            id: u.id,
            name: card.querySelector(".edit-name").value.trim(),
            surname: card.querySelector(".edit-surname").value.trim(),
            email: card.querySelector(".edit-email").value.trim()
        };

        console.log("Dati inviati per modifica:", body);
        
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
        form.classList.add('fade-in'); //dissolvenza
    } else {
        form.style.display = "none";
    }
}

//GENERALE
window.addEventListener('keydown', e => { 
    if(e.ctrlKey && e.key === 'z') eseguiUndo(); 
});

controllaCookie();