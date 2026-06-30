import './init';
 
//Utility to return precompiled template 
import registry from "@qgds/lib/templates/_registry";
import sqField from './sqField';

const compile = async (
  name:keyof typeof registry, 
  data: any = {},
  editable: string[] = []
): Promise<string> => {

  const hb = globalThis.Handlebars;

  //Load the template only if not already in memory
  if (!hb.templates?.[name]) {
    const loader = registry[name];
    //Confirm template exists
    if (!loader) throw new Error(`Template "${name}" not found.`);

    await loader();
  }
  const compiled = hb.templates?.[name]?.(data) ?? 
         (() => { throw new Error(`Template "${name}" failed to render.`); })();
         
  return compiled;//sqField(compiled, editable);
}

export default compile;
