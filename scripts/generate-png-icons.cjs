const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const rCross = width * (isMaskable ? 0.32 : 0.4);
  const crossThick = width * (isMaskable ? 0.08 : 0.1);

  // Colors:
  // Olive: #5A5A40 -> 90, 90, 64
  // Dark Olive: #4A4A35 -> 74, 74, 53
  // Amber: #D1A661 -> 209, 166, 97
  // White: #FFFFFF -> 255, 255, 255
  // Sage: #8C9C82 -> 140, 156, 130

  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: #5A5A40
      let r = 90;
      let g = 90;
      let b = 64;
      let a = 255;

      if (!isMaskable) {
        // Rounded corners radius
        const cornerR = width * 0.18;
        const inLeft = x < cornerR;
        const inRight = x > width - cornerR;
        const inTop = y < cornerR;
        const inBottom = y > height - cornerR;
        if ((inLeft || inRight) && (inTop || inBottom)) {
          const cornerCenterX = inLeft ? cornerR : width - cornerR;
          const cornerCenterY = inTop ? cornerR : height - cornerR;
          const cornerDist = Math.hypot(x - cornerCenterX, y - cornerCenterY);
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Inner circle
        if (dist <= rCross + 12 && dist >= rCross - 4) {
          // Gold border
          r = 209; g = 166; b = 97;
        } else if (dist < rCross) {
          // Inner dark background
          r = 74; g = 74; b = 53;
        }

        // Cross shape
        const inVertBar = Math.abs(dx) <= crossThick && Math.abs(dy) <= rCross * 0.8;
        const inHorizBar = Math.abs(dy) <= crossThick && Math.abs(dx) <= rCross * 0.8;

        if (inVertBar || inHorizBar) {
          r = 255; g = 255; b = 255;
        }

        // Central amber ring
        if (dist <= crossThick * 0.8) {
          r = 209; g = 166; b = 97;
        }
      }

      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '..', 'public');

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));

console.log('PWA PNG icons generated successfully!');
