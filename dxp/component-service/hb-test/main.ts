import { compile } from "@qgds/handlebars";
import { getEnv } from "@utils/environment"; 

  interface BlockquoteInput {
    content: string;
    citeUrlClickable: "yes" | "no";
    'cite-text'?: string;
    citeUrl?: string; 
  }  

export default {
  async main(input: BlockquoteInput, info: any) {

    // const hbData = {
    //   content       : input.content,
    //   "cite-url"    : input.citeUrl,
    //   "cite-text"   : input.citeUrlClickable === "yes" ? 
    //                   new Handlebars.SafeString(`<a href="${input.citeUrl}">${input['cite-text']}</a>`) : input['cite-text']
    // };

    
    //const disableEditing = ["citation"];
    return `<div>test</div>`;
    //return await compile('blockquote', hbData);

  }
};