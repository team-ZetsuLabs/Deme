package dev.zetsu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zetsu.auth.ActiveAccountFilter;
import dev.zetsu.auth.AuthController;
import dev.zetsu.auth.EmailUserDetailsService;
import dev.zetsu.auth.OAuthUserService;
import dev.zetsu.common.ApiError;
import dev.zetsu.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Session par cookie HttpOnly + jeton CSRF (cookie XSRF-TOKEN lisible par le front, renvoyé dans l'en-tête
 * X-XSRF-TOKEN). Pas de JWT. Réponses 401 / 403 au format {@link ApiError}.
 */
@Configuration
@EnableMethodSecurity
@EnableScheduling
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http, ZetsuProperties props, ObjectMapper mapper,
                            CsrfTokenRepository csrfRepository, SecurityContextRepository contextRepository,
                            ObjectProvider<ClientRegistrationRepository> oauthClients,
                            OAuthUserService oauthUserService, UserRepository users) throws Exception {
        http
                .securityContext(c -> c.securityContextRepository(contextRepository))
                .csrf(c -> c
                        .csrfTokenRepository(csrfRepository)
                        // Jeton brut (sans masquage BREACH) : la valeur du cookie est celle à renvoyer.
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
                .addFilterBefore(new ActiveAccountFilter(users), AuthorizationFilter.class)
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/v1/docs", "/api/v1/docs/**", "/api/v1/swagger-ui/**",
                                "/api/v1/openapi.json", "/api/v1/openapi.json/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/questions/**", "/api/v1/answers/**", "/api/v1/users/**",
                                "/api/v1/tags/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().denyAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                write(res, mapper, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Connexion requise"))
                        .accessDeniedHandler((req, res, ex) -> {
                            if (ex instanceof CsrfException) {
                                write(res, mapper, HttpStatus.FORBIDDEN, "CSRF_INVALID",
                                        "Jeton CSRF manquant ou invalide, rechargez la page");
                            } else {
                                write(res, mapper, HttpStatus.FORBIDDEN, "FORBIDDEN", "Action interdite");
                            }
                        }))
                .logout(l -> l
                        .logoutUrl("/api/v1/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
                        .deleteCookies("JSESSIONID"))
                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable())
                .requestCache(r -> r.disable());

        // OAuth GitHub / Google seulement si les identifiants sont fournis (profil « oauth »).
        if (oauthClients.getIfAvailable() != null) {
            http.oauth2Login(o -> o
                    .authorizationEndpoint(ae -> ae.baseUri(AuthController.OAUTH_AUTHORIZATION_BASE))
                    .redirectionEndpoint(re -> re.baseUri("/api/v1/auth/oauth2/callback/*"))
                    .userInfoEndpoint(ui -> ui.userService(oauthUserService))
                    .defaultSuccessUrl(props.frontUrl(), true)
                    .failureUrl(props.frontUrl() + (props.frontUrl().endsWith("/") ? "" : "/") + "login?error=oauth"));
        }
        return http.build();
    }

    @Bean
    CsrfTokenRepository csrfTokenRepository(ZetsuProperties props) {
        CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repo.setCookiePath("/");
        repo.setCookieCustomizer(c -> c.secure(props.cookieSecure()).sameSite("Lax"));
        return repo;
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(EmailUserDetailsService userDetailsService, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }

    private static void write(HttpServletResponse res, ObjectMapper mapper, HttpStatus status,
                              String code, String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getOutputStream(), ApiError.of(code, message));
    }

    /** Spring Security 6 ne crée le jeton que s'il est lu : on le lit pour que le cookie soit toujours posé. */
    static final class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (token != null) {
                token.getToken();
            }
            chain.doFilter(request, response);
        }
    }
}
