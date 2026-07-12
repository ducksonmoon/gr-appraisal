'use client';

import { useEffect } from 'react';

const VAZIR_HREF =
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirfont@v30.1.0/dist/font-face.css';

/** Inject Vazir stylesheet once; also add a preload link for faster first paint. */
export default function FontLoader() {
  useEffect(() => {
    if (document.querySelector(`link[href="${VAZIR_HREF}"]`)) return;

    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'style';
    preload.href = VAZIR_HREF;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = VAZIR_HREF;

    document.head.appendChild(preload);
    document.head.appendChild(link);
  }, []);

  return null;
}
