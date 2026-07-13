import localFont from 'next/font/local';

/**
 * Self-hosted Vazirmatn (variable). Files live under fonts/vazirmatn/.
 */
export const vazirmatn = localFont({
  src: '../fonts/vazirmatn/Vazirmatn-Variable.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: '100 900',
});
