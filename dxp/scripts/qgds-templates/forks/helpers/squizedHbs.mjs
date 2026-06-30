// Injects data-sq-field attributes into raw Handlebars templates.
//   1. Direct Tagging: If a variable is the ONLY thing inside a tag, 
//      the attribute is added directly to that parent tag.
//   2. Mixed Wrapping: If a variable shares a tag with other text, 
//      it is wrapped in a neutral <sq-field> element.

export const squizedHbs = (source) => {
    let processed = source;

    // LOGIC GUARD - Negative lookahead to skip Handlebars logic, comments, and blocks:
    // - \s*           : Allows for leading whitespace inside the braces
    // - [#\/^@]       : Skips block opens, closes, inverted sections, and data variables (e.g., @index)
    // - !             : Skips Handlebars comments (e.g., {{!-- comment --}})
    // - *             : Skips decorators/inlines (e.g., {{#*inline "name"}})
    // - >             : Skips partials (e.g., {{> partialName}})
    // - else|this|... : Skips reserved keywords and specific design system helpers
    const logicGuard = `\\s*(?![#\\/^@!*>]|else\\b|this\\b|log\\b|lookup\\b|isdefined\\b|ifCond\\b)`;

    // FIELD MATCH - Captures the "clean" variable name while ignoring syntax fluff:
    // - [~.]*         : Matches (but does not capture) leading whitespace control (~) or dots
    // - ([\w.-]+)     : Captured Group: The actual field name (alphanumeric, dots, or hyphens)
    // - [~.]*         : Matches (but does not capture) trailing whitespace control or dots
    const fieldMatch = `[~.]*([\\w.-]+)[~.]*`;

    // MUSTACHE VARIATIONS - Matches both {{var}} and {{{var}}} 
    const mustacheVar = `\\{\\{\\{?\\s*${logicGuard}${fieldMatch}\\s*\\}?\\}\\}`;
    
    // STEP 1: Direct Tag Injection - Targets variables that are the ONLY content inside a tag.
    // Example: <div class="x">{{~title~}}</div>  =>  <div class="x" data-sq-field="title">{{~title~}}</div>
    // $1: (<[\w-]+[^>]*?)              -> Matches opening tag start (e.g., '<div class="card"')
    // $2: (\s*>)                       -> Matches the closing bracket (allows space before '>')
    // $3: (\s*\{\{\{? ... \}\}\}\s*)   -> The full HBS variable string to be preserved in the output
    // $4: ([\w.-]+)                    -> The "clean" field name captured by fieldMatch for the attribute value
    // $5: (<\s*\/\s*[\w-]+\s*>)        -> The full closing tag (e.g., '</ div >')
        const directRegex = new RegExp(
            `(<[\\w-]+[^>]*?)` + 
            `(\\s*>)` + 
            `(\\s*${mustacheVar}\\s*)` + 
            `(<\\s*\\/\\s*[\\w-]+\\s*>)`,
            'g'
        );
        // Apply Step 1: Injects data-sq-field="$4" into the opening tag string ($1)
        processed = processed.replace(directRegex, '$1 data-sq-field="$4"$2$3$5');

    // STEP 2: Mixed Content / Custom Tag Wrapping - Targets variables mixed with other text.
    // Example: "By {{author}}"  =>  "By <sq-field data-sq-field="author">{{author}}</sq-field>"
    // (?![^<]*>)                       -> Lookahead: Skips variables found inside HTML attributes (like class="{{var}}")
    // $1: ({{{? ... }}})               -> Captured Group: The full Handlebars variable including stashes
    // $2: ([\w.-]+)                    -> Captured Group: The "clean" field name from fieldMatch for the attribute value
        const mixedRegex = new RegExp(
            `(?![^<]*>)` + 
            `(${mustacheVar})`,
            'g'
        );
        // Process Step 2 using the 'offset' to check the current context. This prevents double-wrapping if Step 1 already tagged the parent.
        processed = processed.replace(mixedRegex, (match, fullVariable, fieldName, offset) => {
            const field = fieldName.trim();
            
            // Get all characters from the start of the file up to this specific match
            const before = processed.slice(0, offset);

            // Find the start of the immediate parent tag
            const lastTagOpen = before.lastIndexOf('<');

            // CHECK if Step 1 already handles this. Look inside the most recent opening tag for data-sq-field.
            if (lastTagOpen !== -1) {
                // Get the chunk of text from the last '<' to the current variable
                const tagContext = before.slice(lastTagOpen);
                
                // If the parent tag string already contains the data-sq-field attribute, skip wrapping
                if (tagContext.includes(`data-sq-field="${field}"`)) {
                    return match; 
                }
            }

            // If no parent was tagged, wrap in a neutral custom element for the Squiz UI
            // sq-field to be shimed `display: contents;` so it won't affect layout but allows us to target the field in the UI
            return `<sq-field style="display: contents;" data-sq-field="${field}">${match}</sq-field>`;
        });

    return processed;
}