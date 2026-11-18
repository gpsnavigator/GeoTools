/** Escapes text for interpolation into an HTML string (Leaflet popups and marker icons are built as raw HTML). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Plain text of an HTML fragment, with <br> and block ends as line breaks -- for showing text from sources that
 * may carry HTML (a GPX <desc>, as Fody's own OSM node export writes it). Text without markup is returned as is.
 */
export function htmlToText(value: string): string {
  if (!/<[a-z!/]|&[#a-z0-9]+;/i.test(value)) {
    return value;
  }
  const doc = new DOMParser().parseFromString(value, 'text/html');
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p, div, li, tr').forEach((block) => block.append('\n'));
  return (doc.body.textContent ?? '').replace(/\n[ \t]*\n+/g, '\n').trim();
}
