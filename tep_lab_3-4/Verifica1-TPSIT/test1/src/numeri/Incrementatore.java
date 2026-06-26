package numeri;

import numeri.util.Escape;

import java.util.concurrent.TimeUnit;

public class Incrementatore extends Thread{
    private static int [] array; //Array con valori da 1 a 100
    private static int tempoAttesa; //Tempo di attesa random uguale per entrambi i 2 estrattori
    private static int indiceAnalizzati =0; //Indice di record analizzati
    private String nomeEstrattore; //Nome estrattore utile solo per far vedere

   /*METODI "INIZIALI"*/
    //Metodo inizializzatore
    public static void inizia(){
        array=new int[100];
        popolaArray();
        tempoAttesa=(int) ((Math.random()*6)+1);
    }

    //Costruttore
    public Incrementatore(String nomeEstrattore){
        this.nomeEstrattore=nomeEstrattore;
    }

    //Popola array
    public static void popolaArray(){
        for (int i=0; i< array.length;i++){
            array[i]=i+1;
        }
    }

    /*METODI "COMPLEMENTARI"*/
    //get e set
    public static int[] getArray() { return array; }
    public static int getIndiceAnalizzati() { return indiceAnalizzati; }

    //Metodo per accedere al record
    public void accedi(){
        if (array[indiceAnalizzati]==(indiceAnalizzati+1)){ //Se siamo il primo ad accedere
            try {
                TimeUnit.SECONDS.sleep(1); //Impiego due secondi ad incrementare in totale
            }catch (Exception e){
                System.out.println(e);
            }
            System.out.println(Escape.GREEN+"----------- INCREMENTO"+Escape.RESET_TEXT); //System non richiesto ma messo per far vedere meglio la fase in questione
            array[indiceAnalizzati]++; //Incremento il numero
            try {
                TimeUnit.SECONDS.sleep(1);
            }catch (Exception e){
                System.out.println(e);
            }

        } else {
            System.out.println(Escape.RED+"Record già modificato ----> "+Escape.RESET_TEXT+nomeEstrattore); //Se sono il secondo ad accedere
            indiceAnalizzati++;
        }
    }


    /*METODO START*/
    public void run() {
        while (array[array.length-1]==array.length){
            try {
                TimeUnit.SECONDS.sleep(tempoAttesa); //Impiego x secondi ad incrementare
            }catch (Exception e){
                System.out.println(e);
            }
            synchronized (array){ //Sincronizzo solo l'accesso
                accedi();
            }
        }
        Visualizzatore.isInterrupted(false); //Dico al visualizzatore che ho finito
    }
}
