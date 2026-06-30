export default (html:string, editable: Array<string> = []) => {
  let result = html;

  // 1. Flatten <sq-field> into parent across multiple lines
  // Uses [\s\S]*? to handle newlines, tabs, and spaces between tags
  const flattenSqField = /<([a-z0-9-]+)([^>]*)>([\s\S]*?)<sq-field\s+data-sq-field="([^"]+)"[^>]*>([\s\S]*?)<\/sq-field>([\s\S]*?)<\/\1>/gi;
  
  result = result.replace(flattenSqField, (match, pTag, pAttrs, lead, fieldVal, content, trail) => {
    // If there is other text/tags (lead or trail), it's not a "solo" child
    // so we don't flatten to avoid breaking the design.
    if (lead.trim() || trail.trim()) return match;

    const attrs = pAttrs.trim() ? ` ${pAttrs.trim()}` : "";
    return `<${pTag}${attrs} data-sq-field="${fieldVal}">${content.trim()}</${pTag}>`;
  });

  // 2. Filter editable fields
  result = result.replace(/\s*data-sq-field="([^"]+)"/gi, (match, val) => {
    return editable.includes(val) ? match : "";
  });

  // 3. Remove leftover <sq-field> tags (handles multiline tags)
  const stripSqFieldRegex = /<sq-field(?![^>]*data-sq-field)[^>]*>([\s\S]*?)<\/sq-field>/gi;
  result = result.replace(stripSqFieldRegex, "$1");

  return result;
};