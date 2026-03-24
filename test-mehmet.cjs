
const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
  try {
    console.log("Keys:", Object.keys(pdf));
    const dataBuffer = fs.readFileSync("/mnt/data/Act 1 of 2025.pdf");
    const uint8Array = new Uint8Array(dataBuffer);
    console.log("Buffer length:", dataBuffer.length);
    
    // Try to use PDFParse
    const parser = new pdf.PDFParse(uint8Array);
    console.log("Parser created");
    
    // The summary said check-pdf-parse.js used getText()
    const text = await parser.getText();
    console.log("Extracted text:", text);
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
