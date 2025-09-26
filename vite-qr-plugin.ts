import type { Plugin } from 'vite';
import qrcode from 'qrcode-terminal';

export function qrCodePlugin(): Plugin {
  return {
    name: 'vite-plugin-qrcode',
    apply: 'serve', // Apply only for dev server
    configureServer(server) {
      const originalPrintUrls = server.printUrls;
      server.printUrls = () => {
        originalPrintUrls();
        const networkUrls = server.resolvedUrls?.network;

        if (!networkUrls || networkUrls.length === 0) {
          return;
        }

        console.log('\n📱 Scan QR codes to open on your device:\n');

        const qrPromises = networkUrls.map(url => 
          new Promise<string>((resolve) => {
            qrcode.generate(url, { small: true }, (qr) => resolve(qr));
          })
        );

        Promise.all(qrPromises).then(qrStrings => {
          const qrLinesArray = qrStrings.map(qr => qr.split('\n'));
          const height = qrLinesArray[0].length;
          const output: string[] = [];

          // Combine QR code lines horizontally
          for (let i = 0; i < height; i++) {
            const line = qrLinesArray.map(qrLines => qrLines[i] || '').join('  ');
            output.push(line);
          }

          // Create centered labels for each QR code
          const labelLine = networkUrls.map((url, index) => {
            const qrWidth = qrLinesArray[index][0].length;
            const hostname = new URL(url).hostname;
            const padding = Math.max(0, Math.floor((qrWidth - hostname.length) / 2));
            const centeredLabel = ' '.repeat(padding) + hostname;
            return centeredLabel.padEnd(qrWidth);
          }).join('  ');
          
          output.push(labelLine);
          console.log(output.join('\n'));
        });
      };
    },
  };
}
