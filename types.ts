
export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  LOADING_FILES = 'LOADING_FILES',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ExtractionResult {
  transactions: Transaction[];
  error?: string;
}
