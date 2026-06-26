package numeri;

public class Main {
    public static void main(String[] args) {
        /*FASE INIZIALE*/
        //Creazione oggetti
        Incrementatore e1=new Incrementatore("E1");
        Incrementatore e2=new Incrementatore("E2");
        Visualizzatore v1=new Visualizzatore();
        //Popolo array e inizializzo informazioni importanti
        Incrementatore.inizia();

        /*INIZIO VERO E PROPRIO PROGRAMMA*/
        e1.start();
        e2.start();
        v1.start();
    }
}