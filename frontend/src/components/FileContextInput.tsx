// src/components/FileContextInput.tsx

import React, { useState } from 'react';

interface FileContextInputProps {
  onFileSelect: (file: { path: string; content: string; language: string }) => void;
  onContextAdd: (context: string) => void;
}

const FileContextInput: React.FC<FileContextInputProps> = ({ onFileSelect, onContextAdd }) => {
  const [filePath, setFilePath] = useState('');
  const [context, setContext] = useState('');

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filePath.trim()) {
      // This would trigger a file read from the backend
      onFileSelect({
        path: filePath,
        content: '', // Will be fetched from backend
        language: filePath.split('.').pop() || 'text',
      });
      setFilePath('');
    }
  };

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context.trim()) {
      onContextAdd(context);
      setContext('');
    }
  };

  return (
    <div className="space-y-3 border border-[#262C38] rounded-md p-3 bg-[#12161F]">
      <p className="font-['JetBrains_Mono'] text-xs text-[#5B6472]">
        Add context for better responses:
      </p>
      
      <form onSubmit={handleFileSubmit} className="flex gap-2">
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="File path (e.g., src/App.tsx)"
          className="flex-1 bg-[#0B0E14] border border-[#262C38] rounded px-3 py-1.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none focus:border-[#35D0B8]"
        />
        <button
          type="submit"
          className="bg-[#35D0B8] hover:bg-[#35D0B8]/90 text-[#0B0E14] font-['JetBrains_Mono'] text-xs font-semibold rounded px-3 py-1.5 transition-colors"
        >
          Add File
        </button>
      </form>

      <form onSubmit={handleContextSubmit} className="flex gap-2">
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Additional context (e.g., This is a React component...)"
          className="flex-1 bg-[#0B0E14] border border-[#262C38] rounded px-3 py-1.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none focus:border-[#35D0B8]"
        />
        <button
          type="submit"
          className="bg-[#35D0B8] hover:bg-[#35D0B8]/90 text-[#0B0E14] font-['JetBrains_Mono'] text-xs font-semibold rounded px-3 py-1.5 transition-colors"
        >
          Add Context
        </button>
      </form>
    </div>
  );
};

export default FileContextInput;