import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import EmbeddedBridge from "@/components/embedded-bridge";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const GTM_ID = "GTM-5ZX5QNDC";

// Inside the Shopify admin iframe only: keep the admin's host/shop across reloads and load
// Shopify App Bridge (must be a plain blocking script, first in <head>). No-op on the website.
const APP_BRIDGE_BOOT = `(function(){try{if(window.top===window.self)return;}catch(e){}
try{var u=new URL(location.href),q=u.searchParams,ss=sessionStorage;
['host','shop'].forEach(function(k){var v=q.get(k);if(v)ss.setItem('skylitee_'+k,v);else if(ss.getItem('skylitee_'+k)){q.set(k,ss.getItem('skylitee_'+k));history.replaceState(history.state,'',u.toString());}});}catch(e){}
document.write('<scr'+'ipt src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></scr'+'ipt>');})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://skylitee.io"),
  title: "Skylitee — Unified Ecommerce Analytics",
  description: "Shopify + Meta + Google unified analytics for D2C brands",
  verification: { google: "tmGd0ZESQ6HhqKrrm4y2x9xsyabdLaS6FeSMtW17QsA" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={process.env.SHOPIFY_CLIENT_ID ?? ""} />
        <script dangerouslySetInnerHTML={{ __html: APP_BRIDGE_BOOT }} />
      </head>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <body className={dmSans.className}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider>{children}</ThemeProvider>
        <EmbeddedBridge />
      </body>
    </html>
  );
}
