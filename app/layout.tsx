import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";

// Runs synchronously before React hydrates.
// Ensures crypto APIs exist on http:// LAN (non-secure context):
// - crypto.getRandomValues: called unconditionally by Next.js 16 navigation fetch code
// - crypto.randomUUID: used by some dependencies
// - crypto.subtle stub: prevents null-deref on non-secure contexts
const CRYPTO_POLYFILL = `(function(){
  var c=window.crypto||(window.crypto={});
  if(typeof c.getRandomValues!=='function'){
    c.getRandomValues=function(a){
      for(var i=0;i<a.length;i++)a[i]=Math.random()*4294967296>>>0;
      return a;
    };
  }
  if(typeof c.randomUUID!=='function'){
    c.randomUUID=function(){
      var b=new Uint8Array(16);
      c.getRandomValues(b);
      b[6]=(b[6]&0x0f)|0x40;b[8]=(b[8]&0x3f)|0x80;
      var h=Array.from(b,function(x){return x.toString(16).padStart(2,'0');});
      return h.slice(0,4).join('')+'-'+h.slice(4,6).join('')+'-'+h.slice(6,8).join('')+'-'+h.slice(8,10).join('')+'-'+h.slice(10).join('');
    };
  }
  if(!c.subtle){
    c.subtle={digest:async function(){return new ArrayBuffer(32);}};
  }
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RondjeBull",
  description: "Darts-scorekeeper voor Cricket / Bull",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RondjeBull",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: CRYPTO_POLYFILL }} />
        <meta name="theme-color" content="#f59e0b" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
