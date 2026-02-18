
import React, { useState } from 'react';
import { Transaction, ProcessingStatus } from './types';
import { convertPdfToImages, fileToBase64 } from './services/pdfService';
import { extractTransactions } from './services/geminiService';
import TransactionTable from './components/TransactionTable';
import SummaryDashboard from './components/SummaryDashboard';

interface FileStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  pages?: number;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'table'>('summary');
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [pageProgress, setPageProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatus(ProcessingStatus.LOADING_FILES);
    setError(null);
    setTransactions([]);
    
    const fileList = Array.from(files) as File[];
    const initialStatuses: FileStatus[] = fileList.map(f => ({
      name: f.name,
      status: 'pending'
    }));
    setFileStatuses(initialStatuses);

    try {
      const allExtractedTransactions: Transaction[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Update current file status to processing
        setFileStatuses(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'processing' } : s
        ));

        try {
          let images: string[] = [];
          if (file.type === 'application/pdf') {
            images = await convertPdfToImages(file);
          } else if (file.type.startsWith('image/')) {
            const b64 = await fileToBase64(file);
            images = [b64];
          }

          if (images.length > 0) {
            setFileStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, pages: images.length } : s
            ));
            
            setStatus(ProcessingStatus.EXTRACTING);
            const results = await extractTransactions(images, (current, total) => {
              setPageProgress({ current, total });
            });
            allExtractedTransactions.push(...results);
          }

          // Mark file as completed
          setFileStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'completed' } : s
          ));
        } catch (fileErr) {
          console.error(`Failed to process ${file.name}:`, fileErr);
          setFileStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' } : s
          ));
        }
      }

      if (allExtractedTransactions.length === 0 && fileList.length > 0) {
        throw new Error("Could not extract any transactions from the provided files.");
      }

      const sorted = allExtractedTransactions.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(sorted);
      setStatus(ProcessingStatus.COMPLETED);
      setViewMode('summary');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during batch processing.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const completedCount = fileStatuses.filter(f => f.status === 'completed').length;
  const pendingCount = fileStatuses.filter(f => f.status === 'pending').length;
  const processingFile = fileStatuses.find(f => f.status === 'processing');

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Description", "Amount", "Category", "Notes"];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.category,
      `"${t.notes.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `bank_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
              S
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">StatementSense</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('summary')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Insights</button>
                <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Full List</button>
              </div>
            )}
            {transactions.length > 0 && (
              <button onClick={exportToCSV} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                CSV
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Multi-File Upload Hero */}
        <section className={`${transactions.length > 0 || status !== ProcessingStatus.IDLE ? 'hidden' : 'block'}`}>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-12 md:p-20 text-center shadow-2xl shadow-indigo-100">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Batch analyze your <br/> bank statements.</h2>
            <p className="text-indigo-100 max-w-xl mx-auto mb-12 text-lg font-medium opacity-90">
              Upload multiple statements at once. Our AI processes every page to give you a unified financial overview.
            </p>
            
            <div className="max-w-md mx-auto">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-400 border-dashed rounded-3xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 text-indigo-600 shadow-xl group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-xl">Upload multiple files</p>
                  <p className="text-indigo-200 text-sm mt-2">Select PDFs or images together</p>
                </div>
                <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </section>

        {/* Processing Dashboard */}
        {(status === ProcessingStatus.LOADING_FILES || status === ProcessingStatus.EXTRACTING) && (
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Processing Batch</h3>
                  <p className="text-slate-500 font-medium mt-1">
                    {processingFile 
                      ? `Analyzing: ${processingFile.name}` 
                      : 'Preparing documents...'}
                  </p>
                </div>
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>

              {/* Counter Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Files</p>
                  <p className="text-2xl font-black text-slate-900">{fileStatuses.length}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Pending</p>
                  <p className="text-2xl font-black text-indigo-700">{pendingCount}</p>
                </div>
              </div>

              {/* Progress Bar for Current File */}
              {status === ProcessingStatus.EXTRACTING && processingFile && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Extracting Page Data</span>
                    <span>{pageProgress.current} / {pageProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${(pageProgress.current / pageProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Detailed Queue List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Status</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {fileStatuses.map((file, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      file.status === 'processing' ? 'bg-indigo-50 border-indigo-200 shadow-sm scale-[1.02]' : 
                      file.status === 'completed' ? 'bg-white border-slate-100 opacity-60' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        {file.status === 'completed' ? (
                          <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        ) : file.status === 'processing' ? (
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        ) : file.status === 'error' ? (
                          <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center shrink-0">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </div>
                        )}
                        <span className="text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.pages && <span className="text-[10px] font-bold text-slate-400">{file.pages} pages</span>}
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${
                          file.status === 'processing' ? 'bg-indigo-600 text-white animate-pulse' : 
                          file.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          file.status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {status === ProcessingStatus.ERROR && (
          <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="text-2xl font-black text-rose-900">Extraction Failed</h3>
            <p className="text-rose-700 font-medium">{error}</p>
            <button onClick={() => setStatus(ProcessingStatus.IDLE)} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors">Try again</button>
          </div>
        )}

        {/* Analysis Results */}
        {transactions.length > 0 && status === ProcessingStatus.COMPLETED && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Unified Report</span>
                <h3 className="text-4xl font-black text-slate-900 mt-4 tracking-tight">Financial Overview</h3>
                <p className="text-slate-500 font-medium mt-1">Aggregated data from {fileStatuses.length} documents</p>
              </div>
              
              <div className="flex items-center gap-3">
                 <label className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm hover:bg-slate-50 cursor-pointer transition-all">
                    Process More Statements
                    <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileUpload} />
                 </label>
              </div>
            </div>

            {viewMode === 'summary' ? (
              <div className="space-y-12">
                <SummaryDashboard transactions={transactions} />
                <div className="pt-8 border-t border-slate-200">
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                         <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                         Transaction History
                      </h4>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
                   </div>
                   <TransactionTable transactions={transactions} />
                </div>
              </div>
            ) : (
              <TransactionTable transactions={transactions} />
            )}
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-slate-200 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-600 rounded-md"></div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">StatementSense AI</span>
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-xs text-center md:text-left">
              Secure, serverless processing. Your financial documents never leave your browser.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex flex-col gap-3">
              <span className="text-slate-900">Tech Stack</span>
              <span>Gemini 3 Flash</span>
              <span>PDF.js Core</span>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-900">Security</span>
              <span>Local Processing</span>
              <span>No Cloud Storage</span>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-900">Export</span>
              <span>Universal CSV</span>
              <span>JSON Struct</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
