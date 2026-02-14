
const escapeHtml = (text: string) => {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const renderNode = (node: any): string => {
    if (!node) return '';

    if (node.type === 'text') {
        let text = escapeHtml(node.text || '');
        if (node.marks) {
            node.marks.forEach((mark: any) => {
                if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                else if (mark.type === 'italic') text = `<em>${text}</em>`;
                else if (mark.type === 'strike') text = `<s>${text}</s>`;
                else if (mark.type === 'underline') text = `<u>${text}</u>`;
                else if (mark.type === 'code') text = `<code class="rounded-md bg-muted px-1.5 py-1 font-mono font-medium">${text}</code>`;
                else if (mark.type === 'link') {
                    const attrs = mark.attrs || {};
                    const href = attrs.href || '#';
                    const target = attrs.target ? ` target="${attrs.target}"` : '';
                    const rel = attrs.rel ? ` rel="${attrs.rel}"` : '';
                    text = `<a href="${href}"${target}${rel} class="text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer">${text}</a>`;
                }
            });
        }
        return text;
    }

    const children = node.content ? node.content.map(renderNode).join('') : '';

    switch (node.type) {
        case 'doc': return children;
        case 'paragraph': return `<p class="my-2">${children}</p>`;
        case 'heading':
            const level = node.attrs?.level || 2;
            return `<h${level} class="mt-6 mb-2">${children}</h${level}>`;
        case 'bulletList':
            return `<ul class="list-disc list-outside my-2 ml-4">${children}</ul>`;
        case 'orderedList':
            return `<ol class="list-decimal list-outside my-2 ml-4">${children}</ol>`;
        case 'listItem':
            return `<li class="my-0">${children}</li>`;
        case 'blockquote':
            return `<blockquote class="border-l-4 border-primary pl-4 py-1">${children}</blockquote>`;
        case 'codeBlock':
            return `<pre class="rounded-md bg-muted text-muted-foreground border p-5 font-mono font-medium"><code>${children}</code></pre>`;
        case 'image':
            const src = node.attrs?.src || '';
            const alt = node.attrs?.alt || '';
            const title = node.attrs?.title || '';
            const width = node.attrs?.width || '';
            const style = width ? ` style="width: ${width}"` : '';
            return `<img src="${src}" alt="${alt}" title="${title}"${style} class="rounded-lg border border-muted" />`;
        case 'hardBreak':
            return '<br>';
        case 'horizontalRule':
            return '<hr class="mt-4 mb-6 border-t border-muted-foreground" />';
        default:
            return children;
    }
}

export const generateHtml = (json: any) => {
    if (!json) return ''
    try {
        let content = json;

        // Parse JSON string if needed, handling potential DOUBLE stringification
        if (typeof content === 'string') {
            try {
                let parsed = JSON.parse(content);
                if (typeof parsed === 'string') {
                    try {
                        parsed = JSON.parse(parsed);
                    } catch (e) {
                        // ignore second parse error
                    }
                }
                content = parsed;
            } catch (e) {
                // content is plain string, wrap in paragraph
                return `<p>${escapeHtml(content)}</p>`
            }
        }

        // Ensure content matches Tiptap schema structure
        if (!content || typeof content !== 'object') {
            return `<p>${escapeHtml(String(content))}</p>`
        }

        if (!content.type) {
            if (Array.isArray(content)) {
                content = { type: 'doc', content }
            } else if (content.content && Array.isArray(content.content)) {
                // Already has content array but missing type
                content = { ...content, type: 'doc' }
            } else {
                // Fallback for empty or unknown
                return ''
            }
        }

        return renderNode(content)

    } catch (e) {
        console.error('Error generating HTML from JSON:', e)
        return ''
    }
}
