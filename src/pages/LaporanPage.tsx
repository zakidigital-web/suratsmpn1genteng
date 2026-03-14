import { useState, useRef } from 'react';
import { useSurat } from '../context/SuratContext';
import { Download, Upload, FileJson, FileSpreadsheet, Calendar, Filter, Printer, BarChart3, Mail, Send } from 'lucide-react';

export default function LaporanPage() {
  const { suratMasuk, suratKeluar, importData } = useSurat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'masuk' | 'keluar'>('masuk');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const filteredMasuk = suratMasuk.filter(s => {
    const matchDate = (!dateFrom || s.tanggalSurat >= dateFrom) && (!dateTo || s.tanggalSurat <= dateTo);
    const matchKat = !filterKategori || s.kategori === filterKategori;
    return matchDate && matchKat;
  });

  const filteredKeluar = suratKeluar.filter(s => {
    const matchDate = (!dateFrom || s.tanggalSurat >= dateFrom) && (!dateTo || s.tanggalSurat <= dateTo);
    const matchKat = !filterKategori || s.kategori === filterKategori;
    return matchDate && matchKat;
  });

  const currentData = tab === 'masuk' ? filteredMasuk : filteredKeluar;

  const exportCSV = () => {
    let csv = '';
    if (tab === 'masuk') {
      csv = 'No,Nomor Surat,Tanggal Surat,Tanggal Terima,Pengirim,Perihal,Kategori,Status,Catatan\n';
      filteredMasuk.forEach((s, i) => {
        csv += `${i + 1},"${s.nomorSurat}","${s.tanggalSurat}","${s.tanggalTerima}","${s.pengirim}","${s.perihal}","${s.kategori}","${s.status}","${s.catatan}"\n`;
      });
    } else {
      csv = 'No,Nomor Surat,Tanggal Surat,Tujuan,Perihal,Kategori,Sifat,Status,Catatan\n';
      filteredKeluar.forEach((s, i) => {
        csv += `${i + 1},"${s.nomorSurat}","${s.tanggalSurat}","${s.tujuan}","${s.perihal}","${s.kategori}","${s.sifat}","${s.status}","${s.catatan}"\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_surat_${tab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = tab === 'masuk'
      ? { suratMasuk: filteredMasuk.map(({ lampiran, ...rest }) => rest) }
      : { suratKeluar: filteredKeluar.map(({ lampiran, tandaTangan, stempel, ...rest }) => rest) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data_surat_${tab}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.suratMasuk || data.suratKeluar) {
          importData(data);
          alert(`Berhasil mengimpor ${(data.suratMasuk?.length || 0) + (data.suratKeluar?.length || 0)} surat`);
        } else {
          alert('Format file tidak valid. Pastikan mengandung key "suratMasuk" atau "suratKeluar".');
        }
      } catch {
        alert('Gagal membaca file. Pastikan file berformat JSON yang valid.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = tab === 'masuk'
      ? filteredMasuk.map((s, i) => `<tr><td>${i + 1}</td><td>${s.nomorSurat}</td><td>${new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</td><td>${s.pengirim}</td><td>${s.perihal}</td><td>${s.kategori}</td><td>${s.status.replace('_', ' ')}</td></tr>`).join('')
      : filteredKeluar.map((s, i) => `<tr><td>${i + 1}</td><td>${s.nomorSurat}</td><td>${new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</td><td>${s.tujuan}</td><td>${s.perihal}</td><td>${s.kategori}</td><td>${s.status.replace('_', ' ')}</td></tr>`).join('');

    const headerCols = tab === 'masuk'
      ? '<th>No</th><th>No. Surat</th><th>Tanggal</th><th>Pengirim</th><th>Perihal</th><th>Kategori</th><th>Status</th>'
      : '<th>No</th><th>No. Surat</th><th>Tanggal</th><th>Tujuan</th><th>Perihal</th><th>Kategori</th><th>Status</th>';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Laporan Surat ${tab === 'masuk' ? 'Masuk' : 'Keluar'}</title>
      <style>body{font-family:Arial;padding:20px}h2,h3{text-align:center;margin:5px 0}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:11px}th,td{border:1px solid #333;padding:6px 8px;text-align:left}th{background:#f0f0f0}p.info{text-align:center;font-size:12px;color:#555}</style>
      </head><body>
      <h2>SMP NEGERI 1 GENTENG</h2><h3>LAPORAN SURAT ${tab.toUpperCase()}</h3>
      <p class="info">${dateFrom ? `Periode: ${new Date(dateFrom).toLocaleDateString('id-ID')} - ${dateTo ? new Date(dateTo).toLocaleDateString('id-ID') : 'sekarang'}` : 'Semua Periode'}</p>
      <table><thead><tr>${headerCols}</tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:20px;font-size:11px">Total: ${currentData.length} surat | Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const categories = [...new Set([...suratMasuk.map(s => s.kategori), ...suratKeluar.map(s => s.kategori)])];

  const statusCount = (data: typeof suratMasuk | typeof suratKeluar) => {
    const counts: Record<string, number> = {};
    data.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return counts;
  };

  const counts = statusCount(currentData);
  const statusLabels: Record<string, string> = {
    belum_dibaca: 'Belum Dibaca', dibaca: 'Dibaca', diproses: 'Diproses', selesai: 'Selesai',
    draft: 'Draft', menunggu_ttd: 'Menunggu TTD', ditandatangani: 'Ditandatangani', terkirim: 'Terkirim'
  };
  const statusColors: Record<string, string> = {
    belum_dibaca: 'bg-red-500', dibaca: 'bg-blue-500', diproses: 'bg-amber-500', selesai: 'bg-emerald-500',
    draft: 'bg-slate-400', menunggu_ttd: 'bg-amber-500', ditandatangani: 'bg-emerald-500', terkirim: 'bg-blue-500'
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Laporan Surat</h1>
        <p className="text-sm text-slate-500">Export, import, dan cetak laporan surat menyurat</p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('masuk')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'masuk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
          <Mail size={16} /> Surat Masuk
        </button>
        <button onClick={() => setTab('keluar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'keluar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
          <Send size={16} /> Surat Keluar
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Filter</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1"><Calendar size={12} className="inline mr-1" />Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1"><Calendar size={12} className="inline mr-1" />Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Kategori</label>
            <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="input-field">
              <option value="">Semua Kategori</option>
              {categories.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card !p-4 text-center">
          <BarChart3 size={20} className="text-indigo-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{currentData.length}</p>
          <p className="text-xs text-slate-500">Total Surat</p>
        </div>
        {Object.entries(counts).slice(0, 3).map(([status, count]) => (
          <div key={status} className="card !p-4 text-center">
            <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-slate-400'} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{count}</p>
            <p className="text-xs text-slate-500">{statusLabels[status] || status}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Export & Import</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} className="btn-success"><FileSpreadsheet size={16} /> Export CSV</button>
          <button onClick={exportJSON} className="btn-primary"><FileJson size={16} /> Export JSON</button>
          <button onClick={handlePrintReport} className="btn-secondary"><Printer size={16} /> Cetak Laporan</button>
          <div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
            <label htmlFor="import-file" className="btn-warning cursor-pointer"><Upload size={16} /> Import JSON</label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-12">No</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">No. Surat</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">{tab === 'masuk' ? 'Pengirim' : 'Tujuan'}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
              ) : currentData.map((s, i) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 text-xs font-medium">{s.nomorSurat}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">{new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{'pengirim' in s ? (s as any).pengirim : (s as any).tujuan}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell truncate max-w-[200px]">{s.perihal}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-neutral">{s.kategori}</span></td>
                  <td className="px-4 py-3">
                    <span className={`${
                      s.status === 'selesai' || s.status === 'ditandatangani' ? 'badge-success' :
                      s.status === 'belum_dibaca' ? 'badge-danger' :
                      s.status === 'diproses' || s.status === 'menunggu_ttd' ? 'badge-warning' : 'badge-info'
                    }`}>{statusLabels[s.status] || s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total: {currentData.length} surat</span>
            <span>
              <Download size={12} className="inline mr-1" />
              Export tersedia dalam format CSV dan JSON
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
