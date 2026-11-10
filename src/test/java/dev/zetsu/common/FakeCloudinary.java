package dev.zetsu.common;

import com.sun.net.httpserver.HttpServer;
import dev.zetsu.config.CloudinaryProperties;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Faux Cloudinary local pour les tests : répond comme l'API et garde chaque requête reçue. */
public class FakeCloudinary implements AutoCloseable {

    public record Request(String method, String path, String query, String body) {
    }

    public static final String SECRET = "secret-de-test";

    private final HttpServer server;
    private final List<Request> requests = new ArrayList<>();
    private volatile int status = 200;

    public FakeCloudinary() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1);
            String path = exchange.getRequestURI().getPath();
            synchronized (requests) {
                requests.add(new Request(exchange.getRequestMethod(), path, exchange.getRequestURI().getRawQuery(),
                        body));
            }
            byte[] response;
            String type = "application/json";
            if (path.endsWith("/upload")) {
                String publicId = field(body, "public_id");
                String format = path.contains("/raw/") ? "" : "\"format\":\"png\",";
                response = ("{\"public_id\":\"" + publicId + "\"," + format + "\"version\":1731234567,"
                        + "\"secure_url\":\"https://res.cloudinary.com/demo/x/v1731234567/" + publicId + "\"}")
                        .getBytes(StandardCharsets.UTF_8);
            } else if (path.endsWith("/download")) {
                response = "%PDF-1.4 cv".getBytes(StandardCharsets.US_ASCII);
                type = "application/pdf";
            } else {
                response = "{\"result\":\"ok\"}".getBytes(StandardCharsets.UTF_8);
            }
            exchange.getResponseHeaders().add("Content-Type", type);
            exchange.sendResponseHeaders(status, response.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        server.start();
    }

    public CloudinaryProperties properties() {
        return new CloudinaryProperties("demo", "123456", SECRET, "zetsu",
                "http://127.0.0.1:" + server.getAddress().getPort(), Duration.ofSeconds(5));
    }

    public void failWith(int status) {
        this.status = status;
    }

    public List<Request> requests() {
        synchronized (requests) {
            return List.copyOf(requests);
        }
    }

    /** Valeur d'un champ d'un formulaire multipart. */
    public static String field(String multipart, String name) {
        String marker = "name=\"" + name + "\"";
        int at = multipart.indexOf(marker);
        if (at < 0) {
            return null;
        }
        int start = multipart.indexOf("\r\n\r\n", at) + 4;
        return multipart.substring(start, multipart.indexOf("\r\n", start));
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
