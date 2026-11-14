/**
 * Court extrait en texte brut à partir du Markdown d'une question, pour l'aperçu au survol
 * quand on n'a que le détail (qui ne fournit pas d'« excerpt »). Le résultat est du texte,
 * affiché échappé par React.
 */
export function stripMarkdown(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // blocs de code
    .replace(/`([^`]+)`/g, '$1') // code en ligne
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // liens → texte
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // titres
    .replace(/^\s{0,3}>\s?/gm, '') // citations
    .replace(/[*_~]+/g, '') // emphase
    .replace(/\s+/g, ' ') // espaces multiples et sauts de ligne
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
