package numeri;

import numeri.util.Escape;

import java.util.concurrent.TimeUnit;

public class Visualizzatore extends Thread{
    private static boolean isGoing=true; //Boolean che mi indica se l'incrementatore va ancora

    public String stampa(){ //Restituisce la stampa della stringa dell'array
        int [] arrayRiferimento= Incrementatore.getArray();
        String s="";

        for (int i=0;i<arrayRiferimento.length;i++){
            s=s+"\t"+arrayRiferimento[i];
        }
        s=s+"\n"+ Escape.YELLOW+"Valore Indice: "+Incrementatore.getIndiceAnalizzati()+Escape.RESET_TEXT;
        return s;
    }

    public static void isInterrupted( boolean result) { //Metodo attivato nell'incrementatore quando si ha terminato ad incrementare
        isGoing=result;
    }

    /*METODO START*/
    public void run() {
        while (isGoing){
            try {
                TimeUnit.SECONDS.sleep(1); //Impiego x secondi ad incrementare
            }catch (Exception e){
                System.out.println(e);
            }
            System.out.println(stampa());
        }
    }

}
