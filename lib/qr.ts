import QRCode from 'qrcode';

/**
 * Generate an SVG string for a QR code that points to the given URL.
 * The SVG is sized to fit naturally in our card design (no fixed pixel
 * dimensions — let CSS scale it).
 */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#29251e',   // var(--ink)
      light: '#f5efe2',  // var(--paper) — transparent against the card
    },
  });
}
