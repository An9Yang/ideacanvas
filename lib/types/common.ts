export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
