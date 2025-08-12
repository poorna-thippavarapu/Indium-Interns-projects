# core.file_utils: file/text ingestion helpers
import PyPDF2

def read_uploaded_text(file) -> str:
    # extract text from an uploaded txt or pdf file
    if file.name.endswith(".txt"):
        return file.read().decode("utf-8")
    reader = PyPDF2.PdfReader(file)
    return "\n".join(page.extract_text() or "" for page in reader.pages)
