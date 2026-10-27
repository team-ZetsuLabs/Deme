package dev.zetsu.ai;

/**
 * Fournisseur d'IA, remplaçable (section 6.3 du cahier des charges). La clé d'API reste côté serveur.
 * Les consignes et le texte du membre voyagent dans deux blocs séparés : le texte du membre n'est jamais
 * concaténé aux consignes (injection de prompt).
 */
public interface AiProvider {

    /**
     * @param instructions consignes fixes, écrites par l'équipe
     * @param memberData   texte du membre, à traiter comme des données
     * @return le JSON produit par le modèle, à valider par l'appelant
     * @throws Unavailable si le fournisseur est coupé, trop lent, ou ne renvoie rien d'exploitable
     */
    String generateJson(String instructions, String memberData);

    /** Fournisseur indisponible : le formulaire doit continuer de marcher sans l'assistant. */
    class Unavailable extends RuntimeException {
        public Unavailable(String message) {
            super(message);
        }

        public Unavailable(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** Aucun fournisseur configuré (pas de clé dans .env) : l'assistant répond toujours indisponible. */
    AiProvider NONE = (instructions, memberData) -> {
        throw new Unavailable("Aucun fournisseur d'IA configuré");
    };
}
