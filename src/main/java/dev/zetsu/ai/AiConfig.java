package dev.zetsu.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    @Bean
    AiProvider aiProvider(AiProperties props, RestClient.Builder builder) {
        if (!props.configured()) {
            log.info("Assistant IA coupé : aucune clé d'API (AI_API_KEY)");
            return AiProvider.NONE;
        }
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(props.timeout());
        builder.requestFactory(factory);
        return switch (props.provider()) {
            case "gemini" -> new GeminiProvider(builder, props);
            default -> throw new IllegalStateException("Fournisseur d'IA inconnu : " + props.provider());
        };
    }
}
