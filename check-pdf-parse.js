import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
if (typeof pdf.PDFParse === 'function') {
  const instance = new pdf.PDFParse(Buffer.from([]));
  console.log("getText type:", typeof instance.getText);
  const text = instance.getText();
  console.log("getText result type:", typeof text);
  if (text instanceof Promise) {
    console.log("getText returns a Promise");
  } else {
    console.log("getText returns a string or something else");
  }
}
