"use strict";

let isOn = false;
let cont = 0;
let idTimer = null;  // Variabile per tenere traccia dell'intervallo

// Funzione per avviare o fermare il contatore
function useCont() {
    let labelCont = document.getElementById("cont");
    let buttonCont = document.getElementById("button_cont");
    
    // Cambia lo stato del contatore (avvia/ferma)
    isOn = !isOn;
    
    labelCont.innerText = cont; // Aggiorna la visualizzazione del contatore

    if (isOn) {
        buttonCont.innerText = "Stop";  // Cambia il testo del pulsante
        buttonCont.style.backgroundColor = "#f44336"; 
        idTimer = setInterval(() => aggCont(labelCont), 1000);  // Avvia l'incremento del contatore ogni secondo
    } else {
        buttonCont.innerText = "Avvia";  // Cambia il testo del pulsante
        buttonCont.style.backgroundColor = "#4CAF50";
        clearInterval(idTimer);  // Ferma l'incremento del contatore
    }
}

// Funzione per azzerare il contatore
function azz() {
    cont = 0;
    document.getElementById("cont").innerText = cont; // Mostra il contatore azzerato
    clearInterval(idTimer);  // Ferma il contatore
    
    document.getElementById("button_cont").innerText = "Avvia"; 
    document.getElementById("button_cont").style.backgroundColor = "#4CAF50";
    isOn = false;  // Il contatore è fermo
}

// Funzione per aggiornare il contatore
function aggCont(labelCont) {
    cont++;
    
    if (cont === 10) {  // Se il contatore raggiunge 10
        cont = 0;  // Resetta il contatore
        imgView(true);  // Mostra l'immagine
        setTimeout(() => imgView(false), 3000);  // Nascondi l'immagine dopo 3 secondi
    }
    
    labelCont.innerText = cont;  // Aggiorna la visualizzazione del contatore
}

// Funzione per cambiare la visibilità dell'immagine
function imgView(isVisible) {
    let divImg = document.getElementById("div_img");
    divImg.style.visibility = isVisible ? "visible" : "hidden";  // Imposta la visibilità
}
