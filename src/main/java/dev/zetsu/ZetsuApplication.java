package dev.zetsu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ZetsuApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZetsuApplication.class, args);
    }
}
