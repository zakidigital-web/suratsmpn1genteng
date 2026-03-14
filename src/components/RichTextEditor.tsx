import { useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, ImagePlus, Undo2, Redo2,
  RemoveFormatting, Minus
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '300px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCmd = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertTable = () => {
    const rows = prompt('Jumlah baris:', '3');
    const cols = prompt('Jumlah kolom:', '3');
    if (!rows || !cols) return;

    const r = parseInt(rows);
    const c = parseInt(cols);
    if (isNaN(r) || isNaN(c) || r < 1 || c < 1) return;

    let table = '<table style="border-collapse:collapse;width:100%;margin:12px 0"><tbody>';
    for (let i = 0; i < r; i++) {
      table += '<tr>';
      for (let j = 0; j < c; j++) {
        const cellStyle = 'border:1px solid #999;padding:6px 10px;min-width:60px';
        if (i === 0) {
          table += `<th style="${cellStyle};background:#f1f5f9;font-weight:600">Header ${j + 1}</th>`;
        } else {
          table += `<td style="${cellStyle}">&nbsp;</td>`;
        }
      }
      table += '</tr>';
    }
    table += '</tbody></table><p><br></p>';

    editorRef.current?.focus();
    document.execCommand('insertHTML', false, table);
    handleInput();
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        editorRef.current?.focus();
        document.execCommand('insertHTML', false,
          `<img src="${reader.result}" style="max-width:100%;height:auto;margin:8px 0;border-radius:4px" />`
        );
        handleInput();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const insertImageUrl = () => {
    const url = prompt('Masukkan URL gambar:');
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      `<img src="${url}" style="max-width:100%;height:auto;margin:8px 0;border-radius:4px" />`
    );
    handleInput();
  };

  const setFontSize = (size: string) => {
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
    fontElements?.forEach(el => {
      (el as HTMLElement).removeAttribute('size');
      (el as HTMLElement).style.fontSize = size;
    });
    handleInput();
  };

  const ToolBtn = ({ onClick, title, active, children }: {
    onClick: () => void; title: string; active?: boolean; children: React.ReactNode
  }) => (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
    >
      {children}
    </button>
  );

  const ToolDivider = () => <div className="w-px h-6 bg-slate-300 mx-0.5" />;

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50 p-1.5 flex flex-wrap items-center gap-0.5">
        <ToolBtn onClick={() => execCmd('undo')} title="Undo"><Undo2 size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('redo')} title="Redo"><Redo2 size={15} /></ToolBtn>
        <ToolDivider />

        <select
          onChange={(e) => {
            if (e.target.value === 'p') execCmd('formatBlock', 'p');
            else if (e.target.value === 'h1') execCmd('formatBlock', 'h1');
            else if (e.target.value === 'h2') execCmd('formatBlock', 'h2');
            else if (e.target.value === 'h3') execCmd('formatBlock', 'h3');
            else if (e.target.value === 'blockquote') execCmd('formatBlock', 'blockquote');
            e.target.value = '';
          }}
          defaultValue=""
          className="text-xs border border-slate-300 rounded px-1.5 py-1 bg-white text-slate-600 cursor-pointer"
          title="Format blok"
        >
          <option value="" disabled>Format</option>
          <option value="p">Paragraf</option>
          <option value="h1">Judul 1</option>
          <option value="h2">Judul 2</option>
          <option value="h3">Judul 3</option>
          <option value="blockquote">Quote</option>
        </select>

        <select
          onChange={(e) => { if (e.target.value) setFontSize(e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="text-xs border border-slate-300 rounded px-1.5 py-1 bg-white text-slate-600 cursor-pointer"
          title="Ukuran font"
        >
          <option value="" disabled>Ukuran</option>
          <option value="10px">10px</option>
          <option value="12px">12pt</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
        </select>

        <ToolDivider />

        <ToolBtn onClick={() => execCmd('bold')} title="Tebal (Ctrl+B)"><Bold size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('italic')} title="Miring (Ctrl+I)"><Italic size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('underline')} title="Garis Bawah (Ctrl+U)"><Underline size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('strikeThrough')} title="Coret"><Strikethrough size={15} /></ToolBtn>
        <ToolDivider />

        <input
          type="color"
          onChange={e => execCmd('foreColor', e.target.value)}
          title="Warna teks"
          className="w-6 h-6 rounded cursor-pointer border border-slate-300"
          defaultValue="#000000"
        />
        <input
          type="color"
          onChange={e => execCmd('hiliteColor', e.target.value)}
          title="Warna latar teks"
          className="w-6 h-6 rounded cursor-pointer border border-slate-300"
          defaultValue="#ffffff"
        />
        <ToolDivider />

        <ToolBtn onClick={() => execCmd('justifyLeft')} title="Rata Kiri"><AlignLeft size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('justifyCenter')} title="Rata Tengah"><AlignCenter size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('justifyRight')} title="Rata Kanan"><AlignRight size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('justifyFull')} title="Rata Kiri-Kanan"><AlignJustify size={15} /></ToolBtn>
        <ToolDivider />

        <ToolBtn onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><List size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('insertOrderedList')} title="Numbered List"><ListOrdered size={15} /></ToolBtn>
        <ToolBtn onClick={() => execCmd('indent')} title="Indent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="5" x2="21" y2="5"/><line x1="11" y1="10" x2="21" y2="10"/><line x1="11" y1="15" x2="21" y2="15"/><line x1="3" y1="20" x2="21" y2="20"/><polyline points="3 15 7 12.5 3 10"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd('outdent')} title="Outdent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="5" x2="21" y2="5"/><line x1="11" y1="10" x2="21" y2="10"/><line x1="11" y1="15" x2="21" y2="15"/><line x1="3" y1="20" x2="21" y2="20"/><polyline points="7 10 3 12.5 7 15"/></svg>
        </ToolBtn>
        <ToolDivider />

        <ToolBtn onClick={insertTable} title="Sisipkan Tabel"><Table size={15} /></ToolBtn>
        <ToolBtn onClick={insertImage} title="Upload Gambar"><ImagePlus size={15} /></ToolBtn>
        <ToolBtn onClick={insertImageUrl} title="Sisipkan Gambar URL">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd('insertHorizontalRule')} title="Garis Horizontal"><Minus size={15} /></ToolBtn>
        <ToolDivider />

        <ToolBtn onClick={() => execCmd('removeFormat')} title="Hapus Format"><RemoveFormatting size={15} /></ToolBtn>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={() => {
          setTimeout(handleInput, 0);
        }}
        className="rich-editor-content outline-none"
        style={{ minHeight, padding: '16px', fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: '1.8' }}
        data-placeholder={placeholder || 'Tulis isi surat di sini...'}
        suppressContentEditableWarning
      />
    </div>
  );
}
