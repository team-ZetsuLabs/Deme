package dev.zetsu.auth;

import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.user.UserDtos.Me;
import dev.zetsu.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "auth", description = "Inscription, connexion par email ou OAuth, session")
public class AuthController {

    public static final String OAUTH_AUTHORIZATION_BASE = "/api/v1/auth/oauth2/authorization";

    private final AuthService authService;
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SessionLogin sessionLogin;
    private final RateLimiter rateLimiter;
    private final ObjectProvider<ClientRegistrationRepository> registrations;

    public AuthController(AuthService authService, UserService userService,
                          AuthenticationManager authenticationManager, SessionLogin sessionLogin,
                          RateLimiter rateLimiter, ObjectProvider<ClientRegistrationRepository> registrations) {
        this.authService = authService;
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.sessionLogin = sessionLogin;
        this.rateLimiter = rateLimiter;
        this.registrations = registrations;
    }

    @GetMapping("/csrf")
    @Operation(summary = "Jeton CSRF courant", description = "Pose aussi le cookie XSRF-TOKEN. À appeler au démarrage du front.")
    public AuthDtos.CsrfTokenResponse csrf(CsrfToken token) {
        return new AuthDtos.CsrfTokenResponse(token.getHeaderName(), token.getToken());
    }

    @GetMapping("/providers")
    @Operation(summary = "Fournisseurs OAuth activés sur ce serveur")
    public AuthDtos.Providers providers() {
        List<AuthDtos.Provider> list = new ArrayList<>();
        ClientRegistrationRepository repo = registrations.getIfAvailable();
        if (repo instanceof Iterable<?> iterable) {
            for (Object o : iterable) {
                String id = ((ClientRegistration) o).getRegistrationId();
                list.add(new AuthDtos.Provider(id, OAUTH_AUTHORIZATION_BASE + "/" + id));
            }
        }
        return new AuthDtos.Providers(list);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Inscription par email (secours d'OAuth)", description = "Connecte le membre dans la foulée.")
    @ApiResponse(responseCode = "201", description = "Compte créé et session ouverte")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "EMAIL_TAKEN, USERNAME_TAKEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me register(@Valid @RequestBody AuthDtos.RegisterRequest req,
                       HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.check(RateLimiter.Rule.REGISTER, request.getRemoteAddr());
        var user = authService.register(req);
        sessionLogin.open(ZetsuPrincipal.of(user), request, response);
        return Me.from(user);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion par email et mot de passe")
    @ApiResponse(responseCode = "200", description = "Session ouverte")
    @ApiResponse(responseCode = "401", description = "INVALID_CREDENTIALS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me login(@Valid @RequestBody AuthDtos.LoginRequest req,
                    HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.check(RateLimiter.Rule.LOGIN, request.getRemoteAddr());
        rateLimiter.check(RateLimiter.Rule.LOGIN, "email:" + req.email().trim().toLowerCase());
        ZetsuPrincipal principal;
        try {
            var auth = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(req.email().trim(), req.password()));
            principal = (ZetsuPrincipal) auth.getPrincipal();
        } catch (AuthenticationException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect");
        }
        sessionLogin.open(principal, request, response);
        return userService.me(principal.id());
    }

    @GetMapping("/me")
    @Operation(summary = "Membre connecté")
    @ApiResponse(responseCode = "200", description = "Membre connecté")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me me(@AuthenticationPrincipal ZetsuPrincipal principal) {
        return userService.me(principal.id());
    }
}
