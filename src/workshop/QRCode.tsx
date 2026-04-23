import { useMemo } from "react";
import qrcode from "qrcode-generator";

interface QRCodeProps {
  url: string;
  size?: number;
}

export function QRCode({ url, size = 200 }: QRCodeProps) {
  const svgMarkup = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = size / moduleCount;
    let paths = "";

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = col * cellSize;
          const y = row * cellSize;
          paths += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><path d="${paths}" fill="#18181b"/></svg>`;
  }, [url, size]);

  return (
    <div
      className="inline-block rounded-xl bg-white p-3 shadow-sm border border-neutral-200"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
