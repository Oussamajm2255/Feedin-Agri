import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import PyPDF2
except ImportError:
    install('PyPDF2')
    import PyPDF2

try:
    import docx
except ImportError:
    install('python-docx')
    import docx

pdf_path = r"d:\Feedinprod-master\smart-farm-frontend\remarque site web.pdf"
docx_path = r"d:\Feedinprod-master\smart-farm-frontend\FEEDINGREEN_Website_Revision_Brief.docx"

print("================== PDF CONTENT ==================")
try:
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                print(f"--- Page {i+1} ---")
                print(text)
except Exception as e:
    print(f"Error reading PDF: {e}")

print("\n================== DOCX CONTENT ==================")
try:
    doc = docx.Document(docx_path)
    for para in doc.paragraphs:
        if para.text.strip():
            print(para.text)
except Exception as e:
    print(f"Error reading DOCX: {e}")
