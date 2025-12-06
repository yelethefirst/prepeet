// Simple client-side Jinja2 renderer
// Handles basic variable replacement, if/else blocks, and for loops

export function renderJinja2(template: string, variables: Record<string, any>): string {
  let html = template;

  // Process {% for %} loops
  html = html.replace(/\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, 
    (match, itemVar, listVar, content) => {
      const list = variables[listVar];
      if (!Array.isArray(list)) return '';
      
      return list.map(item => {
        let itemContent = content;
        // Replace item.property references
        itemContent = itemContent.replace(new RegExp(`{{\\s*${itemVar}\\.(\\w+)\\s*}}`, 'g'), 
          (_m: string, prop: string) => String(item[prop] || ''));
        // Replace simple item references
        itemContent = itemContent.replace(new RegExp(`{{\\s*${itemVar}\\s*}}`, 'g'), 
          String(item));
        return itemContent;
      }).join('');
    }
  );

  // Process {% if %} blocks
  html = html.replace(/\{%\s*if\s+(\w+)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g,
    (match, condition, ifContent, elseContent = '') => {
      const value = variables[condition];
      // Truthy check: true, non-empty string, non-zero number
      const isTruthy = value === true || value === 'true' || 
                       (typeof value === 'string' && value !== '' && value !== 'false') ||
                       (typeof value === 'number' && value !== 0);
      return isTruthy ? ifContent : elseContent;
    }
  );

  // Replace variables {{ variable }}
  html = html.replace(/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g, (match, path) => {
    const keys = path.split('.');
    let value: any = variables;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return '';
    }
    
    return String(value ?? '');
  });

  return html;
}
