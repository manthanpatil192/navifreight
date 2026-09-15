import fs from 'fs';

// 1. Update liveAisVessels.js
const path1 = 'src/data/liveAisVessels.js';
let c1 = fs.readFileSync(path1, 'utf8');

c1 = c1.replace(/etaTimestamp:\s*['"]Approaching 80 NM Gate['"]/g, "etaTimestamp: '2026-09-13 00:45 IST'");
c1 = c1.replaceAll('2026-09-05', '2026-09-12');
c1 = c1.replaceAll('2026-09-06', '2026-09-13');
c1 = c1.replaceAll('2026-09-07', '2026-09-13');
c1 = c1.replaceAll('2026-09-08', '2026-09-14');
c1 = c1.replaceAll('2026-09-09', '2026-09-14');

fs.writeFileSync(path1, c1, 'utf8');
console.log('Updated liveAisVessels.js successfully');

// 2. Update generate_ais_fleet_165.js
const path2 = 'scripts/generate_ais_fleet_165.js';
let c2 = fs.readFileSync(path2, 'utf8');

c2 = c2.replace(/etaTimestamp:\s*`2026-09-0\$\{6\s*\+\s*\(i\s*%\s*3\)\}/g, 'etaTimestamp: `2026-09-${12 + (i % 3)}');
c2 = c2.replace(/etaTimestamp:\s*`2026-09-0\$\{6\s*\+\s*\(i\s*%\s*2\)\}/g, 'etaTimestamp: `2026-09-${12 + (i % 2)}');

fs.writeFileSync(path2, c2, 'utf8');
console.log('Updated generate_ais_fleet_165.js successfully');
