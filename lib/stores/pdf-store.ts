import { create } from 'zustand';

interface PDFFile {
  id: string;
  name: string;
  size: number;
  content?: string;
  title?: string;
}

interface PDFStore {
  uploadedFiles: PDFFile[];
  addFile: (file: PDFFile) => void;
  removeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
}

export const usePDFStore = create<PDFStore>((set) => ({
  uploadedFiles: [],
  addFile: (file) => set((state) => ({
    uploadedFiles: [...state.uploadedFiles, file]
  })),
  removeFile: (id) => set((state) => ({
    uploadedFiles: state.uploadedFiles.filter(f => f.id !== id)
  })),
  updateFileContent: (id, content) => set((state) => ({
    uploadedFiles: state.uploadedFiles.map(f => 
      f.id === id ? { ...f, content } : f
    )
  }))
}));
