import { escapeHtml } from '@/lib/sanitize';

const TEXT_STYLE =
  'color: #3b4571; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;';
const LINK_STYLE = 'color: #eb5d8e; text-decoration: underline;';

function renderInline(escaped: string): string {
  return escaped
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_match, label: string, url: string) =>
        `<a href="${url}" style="${LINK_STYLE}">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Renders the small markdown subset allowed in communications: paragraphs
 * (blank line), line breaks, **bold** and [label](https://url) links.
 * All input is HTML-escaped first, so nothing else can reach the output.
 */
export function renderCommunicationBody(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="${TEXT_STYLE}">${renderInline(escapeHtml(paragraph)).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}
