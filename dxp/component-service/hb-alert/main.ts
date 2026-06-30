import { compile } from "@qgds/handlebars";

  interface AlertInput {
  "variantClass"    : string,
  "heading"         : string,
  "content"         : string
  }  

export default {
  async main(input: AlertInput, info: any) {

    const hbData = {
      "variantClass"    : input.variantClass || `alert-info`,
      "heading"         : input.heading || `Test Alert`,
      "content"         : input.content || `This is a test alert`
    };
    
    //const disableEditing = ["citation"];
    return await compile('inpageAlert', hbData);

  }
};