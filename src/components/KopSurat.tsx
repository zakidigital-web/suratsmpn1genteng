import { SchoolSettings } from '../types';

interface KopSuratProps {
  settings: SchoolSettings;
  className?: string;
}

export default function KopSurat({ settings, className = '' }: KopSuratProps) {
  const kop = settings.kopSettings;
  const borderClass = {
    double: 'border-b-4 border-double border-black',
    single: 'border-b-2 border-black',
    thick: 'border-b-[6px] border-black',
    none: '',
  }[kop.borderStyle] || 'border-b-4 border-double border-black';

  return (
    <div className={`${borderClass} pb-3 mb-4 ${className}`}>
      <div className="flex items-center gap-4">
        {settings.logoKiri && (
          <img
            src={settings.logoKiri}
            alt="Logo Kiri"
            className="object-contain flex-shrink-0"
            style={{
              width: `${kop.logoKiriSize}px`,
              height: `${kop.logoKiriSize}px`,
              marginLeft: `${kop.logoKiriOffsetX}px`,
              marginTop: `${kop.logoKiriOffsetY}px`,
            }}
          />
        )}
        <div className="flex-1 text-center">
          {kop.lines.map((line, idx) => (
            <p
              key={idx}
              style={{
                fontSize: `${line.fontSize}pt`,
                fontWeight: line.bold ? 'bold' : 'normal',
                fontStyle: line.italic ? 'italic' : 'normal',
                textTransform: line.uppercase ? 'uppercase' : 'none',
                letterSpacing: line.fontSize >= 14 ? '0.1em' : '0.05em',
                margin: '1px 0',
              }}
            >
              {line.text}
            </p>
          ))}
          {kop.showAddress && (
            <p style={{ fontSize: `${kop.addressFontSize}pt`, margin: '1px 0' }}>
              {settings.alamat} Kode Pos {settings.kodePos}
            </p>
          )}
          {kop.showContact && (
            <>
              <p style={{ fontSize: `${kop.contactFontSize}pt`, margin: '1px 0' }}>
                Telepon: {settings.telepon} | Email: {settings.email}
              </p>
              <p style={{ fontSize: `${kop.contactFontSize}pt`, margin: '1px 0' }}>
                Website: {settings.website} | NPSN: {settings.npsn}
              </p>
            </>
          )}
        </div>
        {settings.logoKanan && (
          <img
            src={settings.logoKanan}
            alt="Logo Kanan"
            className="object-contain flex-shrink-0"
            style={{
              width: `${kop.logoKananSize}px`,
              height: `${kop.logoKananSize}px`,
              marginRight: `${kop.logoKananOffsetX}px`,
              marginTop: `${kop.logoKananOffsetY}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}
