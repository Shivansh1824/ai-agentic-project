/**
 * Resume Parser — Client-side PDF and DOCX text extraction
 * Uses pdf.js for PDF files and mammoth for DOCX files
 */

/**
 * Extract text from a PDF file using pdf.js
 */
export async function extractFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
}

/**
 * Extract text from a DOCX file using mammoth
 */
export async function extractFromDOCX(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Extract text from any supported file type
 */
export async function extractText(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await extractFromPDF(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return await extractFromDOCX(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}

/**
 * Validate resume file before processing
 */
export function validateResumeFile(file) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
  
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Only PDF and DOCX files are accepted' };
  }
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be under 10MB' };
  }
  
  return { valid: true, error: null };
}
