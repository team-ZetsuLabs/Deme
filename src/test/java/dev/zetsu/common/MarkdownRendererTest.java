package dev.zetsu.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MarkdownRendererTest {

    private final MarkdownRenderer renderer = new MarkdownRenderer();

    @Test
    void scriptEstEchappe() {
        String html = renderer.toSafeHtml("<script>alert(1)</script>");
        assertThat(html).doesNotContain("<script").contains("&lt;script&gt;");
    }

    @Test
    void imageAvecOnerrorNePassePas() {
        assertThat(renderer.toSafeHtml("<img src=x onerror=alert(1)>")).doesNotContain("<img");
        assertThat(renderer.toSafeHtml("![x](https://exemple.com/x.png)")).doesNotContain("<img");
    }

    @Test
    void seulsLesLiensHttpEtHttpsSontGardes() {
        assertThat(renderer.toSafeHtml("[a](javascript:alert(1))")).doesNotContain("javascript");
        assertThat(renderer.toSafeHtml("[a](data:text/html;base64,PHNjcmlwdD4=)")).doesNotContain("data:");
        assertThat(renderer.toSafeHtml("[doc](https://docs.wave.com)"))
                .contains("href=\"https://docs.wave.com\"")
                .contains("rel=\"nofollow noopener noreferrer\"");
    }

    @Test
    void codeEtTableauxSontRendus() {
        String html = renderer.toSafeHtml("```java\nSystem.out.println(\"<b>\");\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |");
        assertThat(html).contains("<pre><code class=\"language-java\">")
                .contains("&lt;b&gt;")
                .contains("<table>");
    }
}
