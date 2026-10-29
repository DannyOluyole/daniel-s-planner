// Run after `npx cap add android`. Customises the generated Android project:
// exact-alarm permission, the planner icon, a plain teal launch screen, a notification icon and the ring tone.
import fs from 'node:fs';
import path from 'node:path';

const main = path.resolve('android/app/src/main');
const res = path.join(main, 'res');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('wrote', path.relative(process.cwd(), file));
}

// 1. Permissions. The notifications plugin already declares boot restore, wake lock, notifications and
//    SCHEDULE_EXACT_ALARM. USE_EXACT_ALARM is granted automatically on Android 13+, so alarms stay exact
//    without the user having to find a settings screen.
const manifestFile = path.join(main, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestFile, 'utf8');
for (const perm of ['USE_EXACT_ALARM', 'VIBRATE']) {
  if (!manifest.includes('android.permission.' + perm)) {
    manifest = manifest.replace('</manifest>', `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
fs.writeFileSync(manifestFile, manifest);
console.log('patched AndroidManifest.xml');

// 2. Launcher icon: gold clock on teal.
write(path.join(res, 'values/ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#005F5F</color>\n</resources>\n');

const clockPath = 'M11.99,2C6.47,2 2,6.48 2,12s4.47,10 9.99,10C17.52,22 22,17.52 22,12S17.52,2 11.99,2zM12,20c-4.42,0 -8,-3.58 -8,-8s3.58,-8 8,-8 8,3.58 8,8 -3.58,8 -8,8zM12.5,7H11v6l5.25,3.15 0.75,-1.23 -4.5,-2.67z';

write(path.join(res, 'drawable/ic_launcher_foreground_planner.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group android:scaleX="2.2" android:scaleY="2.2" android:translateX="27.6" android:translateY="27.6">
        <path android:fillColor="#E5C568" android:pathData="${clockPath}" />
    </group>
</vector>
`);

const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground_planner"/>
</adaptive-icon>
`;
write(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
write(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);

// 3. Launch screen: plain teal instead of the default Capacitor logo.
const stylesFile = path.join(res, 'values/styles.xml');
const styles = fs.readFileSync(stylesFile, 'utf8');
fs.writeFileSync(stylesFile, styles.replace('@drawable/splash', '@color/ic_launcher_background'));
console.log('patched styles.xml');

// 4. Status-bar icon for notifications (must be a plain white shape).
write(path.join(res, 'drawable/ic_stat_planner.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="${clockPath}" />
</vector>
`);

// 5. Ring tone for the hourly alarm: four two-tone chimes, about 8 seconds, so it is hard to miss.
function ringTone() {
  const rate = 22050, notes = [880, 660, 880, 660], noteLen = 0.35, gap = 0.5, repeats = 4;
  const noteSamples = Math.floor(noteLen * rate), gapSamples = Math.floor(gap * rate);
  const samples = new Int16Array(repeats * (notes.length * noteSamples + gapSamples));
  let pos = 0;
  for (let r = 0; r < repeats; r++) {
    for (const freq of notes) {
      for (let i = 0; i < noteSamples; i++) {
        const t = i / rate;
        const envelope = Math.min(1, t / 0.02) * Math.min(1, (noteLen - t) / 0.06);
        samples[pos + i] = Math.round(Math.sin(2 * Math.PI * freq * t) * envelope * 0.8 * 32767);
      }
      pos += noteSamples;
    }
    pos += gapSamples;
  }
  const dataBytes = samples.length * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  Buffer.from(samples.buffer).copy(wav, 44);
  return wav;
}
write(path.join(res, 'raw/ring.wav'), ringTone());
