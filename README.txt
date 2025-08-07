# PRISM: Modular Data & Image Processing App

PRISM is a modular, AI-assisted web application for data and image preprocessing, augmentation, and review. It features a modern React frontend and a Python backend API, supporting both deterministic and ML training augmentation modes, with interactive controls and AI explanations.

## Features

- **Drag & Drop File Upload**: Supports images, CSV, and text files.
- **AI-Generated Processing Plans**: Automatically generates preprocessing steps using LLMs.
- **Live Plan Editing**: Modify, reorder, or remove steps in real time.
- **Data Augmentation**: Switch between deterministic and ML training modes with fine-grained controls.
- **Interactive Previews**: See the effect of each step on your data or images.
- **AI Explanations**: Toggle learning mode to get step-by-step explanations for each operation.
- **Batch Processing & Download**: Apply your plan to all files and download results as a ZIP.

## Project Structure

```
.
├── api_server.py           # FastAPI backend server
├── main_app.py             # Main backend app entry
├── requirements.txt        # Python dependencies
├── agents/                 # Python agent modules for processing
├── frontend/               # React frontend source code
│   └── src/
│       ├── components/     # React UI components (controls, panels, preview, etc.)
│       ├── hooks/          # Custom React hooks (file upload, plan generation, etc.)
│       └── ...
├── data/                   # Data files
├── processed_images/       # Output images
├── temp_uploads/           # Temporary upload storage
├── cleaned_uploads/        # Cleaned data storage
└── ...
```

## Getting Started

### Backend (Python)

1. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

2. **Run the API server:**
   ```sh
   python api_server.py
   ```
   The backend will start at `http://localhost:8000`.

### Frontend (React)

1. **Install dependencies:**
   ```sh
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```sh
   npm start
   ```
   The frontend will run at `http://localhost:3000`.

## Usage

1. Open the app in your browser.
2. Upload images, CSV, or text files.
3. Review and edit the AI-generated processing plan.
4. Use the control panels to adjust parameters and augmentation settings.
5. Toggle "Learning Mode" for AI explanations.
6. Apply the plan and download your processed files.

## Customization

- **Agents**: Add or modify processing logic in the `agents/` Python modules.
- **Frontend Controls**: Extend or customize UI in `frontend/src/components/controls/`.
