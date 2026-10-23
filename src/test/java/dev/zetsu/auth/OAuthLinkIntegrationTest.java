package dev.zetsu.auth;

import dev.zetsu.IntegrationTest;
import dev.zetsu.auth.OAuthUserService.ExternalProfile;
import dev.zetsu.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/** AUTH-2 : rattachement des comptes GitHub et Google par email vérifié. */
class OAuthLinkIntegrationTest extends IntegrationTest {

    @Autowired
    private OAuthUserService oauth;

    @Test
    void githubPuisGoogleAvecLeMemeEmailMenentAuMemeProfil() {
        User viaGithub = oauth.findOrCreate("github",
                new ExternalProfile("gh-501", "kwame-codes", "Kwame Asante", "kwame.asante@exemple.gh", null));
        User viaGoogle = oauth.findOrCreate("google",
                new ExternalProfile("g-77001", "Kwame", "Kwame Asante", "Kwame.Asante@exemple.gh", null));

        assertThat(viaGoogle.getId()).isEqualTo(viaGithub.getId());
        assertThat(viaGithub.isEmailVerified()).isTrue();
        assertThat(oauth.findOrCreate("github",
                new ExternalProfile("gh-501", "kwame-codes", "Kwame Asante", null, null)).getId())
                .isEqualTo(viaGithub.getId());
    }

    @Test
    void unCompteEmailNonVerifieNestJamaisRattache() throws Exception {
        Member awa = register("Awa");

        User viaGoogle = oauth.findOrCreate("google",
                new ExternalProfile("g-88002", "Awa", "Awa Ndiaye", awa.email(), null));

        assertThat(viaGoogle.getId()).isNotEqualTo(awa.id());
        assertThat(viaGoogle.getEmail()).isNull();
    }

    @Test
    void sansEmailVerifieOnCreeUnCompteSansEmail() {
        User user = oauth.findOrCreate("github",
                new ExternalProfile("gh-9031", "ngozi-dev", "Ngozi Okafor", null, null));

        assertThat(user.getEmail()).isNull();
        assertThat(user.getUsername()).isEqualTo("ngozi_dev");
    }
}
