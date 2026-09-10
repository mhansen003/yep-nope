import "./globals.css";

export const metadata = {
  title: "YEP or NOPE",
  description:
    "Ask a question. Get one verdict. Everybody got choices - this one ain't yours.",
  openGraph: {
    title: "YEP or NOPE",
    description: "Ask a question. Get one verdict.",
  },
};

export const viewport = {
  themeColor: "#12061f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Outfit:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
