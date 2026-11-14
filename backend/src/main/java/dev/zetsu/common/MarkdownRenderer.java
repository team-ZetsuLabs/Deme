package dev.zetsu.common;

import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Transforme le Markdown d'un membre en HTML sûr : le HTML brut est échappé au rendu, puis le résultat
 * repasse par une liste blanche (balises, attributs, liens http/https uniquement).
 * Le front repasse encore ce HTML par DOMPurify dans {@code MemberContent}.
 */
@Component
public class MarkdownRenderer {

    private static final Safelist SAFELIST = new Safelist()
            .addTags("p", "br", "hr", "strong", "em", "del", "blockquote", "ul", "ol", "li",
                    "h1", "h2", "h3", "h4", "h5", "h6", "pre", "code", "a",
                    "table", "thead", "tbody", "tr", "th", "td")
            .addAttributes("a", "href", "title")
            .addAttributes("code", "class")
            .addAttributes("ol", "start")
            .addAttributes("th", "align")
            .addAttributes("td", "align")
            .addProtocols("a", "href", "http", "https")
            .addEnforcedAttribute("a", "rel", "nofollow noopener noreferrer");

    private static final Document.OutputSettings OUTPUT = new Document.OutputSettings().prettyPrint(false);

    private final Parser parser;
    private final HtmlRenderer renderer;

    public MarkdownRenderer() {
        var extensions = List.of(TablesExtension.create());
        this.parser = Parser.builder().extensions(extensions).build();
        this.renderer = HtmlRenderer.builder()
                .extensions(extensions)
                .escapeHtml(true)
                .sanitizeUrls(true)
                .build();
    }

    public String toSafeHtml(String markdown) {
        String html = renderer.render(parser.parse(markdown == null ? "" : markdown));
        return Jsoup.clean(html, "", SAFELIST, OUTPUT);
    }
}
