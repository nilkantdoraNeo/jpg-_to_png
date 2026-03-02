"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOMAIN = "https://jpgtopng.nexcatech.in";
const TODAY = "2026-03-02";

const tools = [
  {
    slug: "jpg-to-png",
    title: "JPG to PNG Converter",
    description: "Convert JPG and JPEG images to PNG instantly with this fast, free, browser-based converter.",
    keywords: "jpg to png,jpeg to png,jpg topng,jpg converter online,convert jpg to png free",
    howto:
      "Upload JPG or JPEG files, click Convert to PNG, then download the converted PNG files instantly. All processing is client-side for better privacy and speed.",
    faq: [
      ["How do I convert JPG to PNG online?", "Upload JPG files, click Convert to PNG, and download your new PNG images in seconds."],
      ["Is this JPG to PNG converter free?", "Yes, it is free and works directly in your browser without account signup."],
      ["Do you upload my files to a server?", "No. Images are converted on your device using Canvas and Web APIs."],
      ["Can I convert multiple JPG files at once?", "Yes. Batch upload and batch download are both supported."]
    ]
  },
  {
    slug: "png-to-jpg",
    title: "PNG to JPG Converter",
    description: "Convert PNG images to JPG format in seconds using secure client-side processing.",
    keywords: "png to jpg,png to jpeg,convert png to jpg free,image converter png jpg",
    howto:
      "Use this PNG to JPG converter to turn transparent PNG files into compressed JPG images for web and sharing. The conversion runs entirely in your browser.",
    faq: [
      ["How do I convert PNG to JPG?", "Upload PNG files, click Convert to JPG, and download the JPG outputs."],
      ["Will transparent PNG backgrounds stay transparent?", "JPG does not support transparency, so transparent areas are filled for JPG output."],
      ["Is there a file limit?", "You can convert multiple files, but very large files may depend on browser memory limits."],
      ["Is this tool mobile-friendly?", "Yes, it works on desktop and mobile browsers."]
    ]
  },
  {
    slug: "jpg-to-webp",
    title: "JPG to WebP Converter",
    description: "Convert JPG or JPEG files to efficient WebP images online with no uploads.",
    keywords: "jpg to webp,jpeg to webp,convert jpg to webp,image webp converter",
    howto:
      "Convert JPG to WebP to reduce file size while preserving image quality. Upload files, convert, and download WebP output instantly.",
    faq: [
      ["Why convert JPG to WebP?", "WebP usually delivers smaller files for faster page loads."],
      ["Is conversion secure?", "Yes. Conversion happens locally in your browser."],
      ["Can I convert multiple JPG files?", "Yes, batch conversion is supported."],
      ["Do I need to install software?", "No installation is required."]
    ]
  },
  {
    slug: "png-to-webp",
    title: "PNG to WebP Converter",
    description: "Convert PNG images to WebP format quickly using this free browser tool.",
    keywords: "png to webp,convert png to webp,image optimizer webp,free png webp converter",
    howto:
      "This PNG to WebP converter helps optimize image size for websites and apps. Upload PNG files and download modern WebP output in a few clicks.",
    faq: [
      ["How to convert PNG to WebP?", "Upload PNG images, click Convert to WebP, and download the output."],
      ["Does WebP support transparency?", "Yes, WebP supports transparency for many use cases."],
      ["Is this tool free?", "Yes, this converter is free to use."],
      ["Can I use it on mobile?", "Yes, it is responsive and works on modern mobile browsers."]
    ]
  },
  {
    slug: "webp-to-jpg",
    title: "WebP to JPG Converter",
    description: "Convert WebP images to JPG online with a modern client-side image converter.",
    keywords: "webp to jpg,webp to jpeg,convert webp to jpg,image converter webp",
    howto:
      "Convert WebP images to widely compatible JPG format for apps, documents, and uploads. No server upload is required.",
    faq: [
      ["How do I convert WebP to JPG?", "Upload WebP files, click Convert to JPG, then download the JPG files."],
      ["Will output quality be good?", "Yes, the converter uses high-quality browser encoding settings."],
      ["Is WebP to JPG batch conversion available?", "Yes, multiple files are supported."],
      ["Can I use this for free?", "Yes, it is free."]
    ]
  },
  {
    slug: "webp-to-png",
    title: "WebP to PNG Converter",
    description: "Convert WebP images to PNG format instantly using Canvas and Web APIs.",
    keywords: "webp to png,convert webp to png,webp converter png",
    howto:
      "Turn WebP files into PNG images for workflows that require PNG format. Upload, convert, and download output quickly with no backend.",
    faq: [
      ["How to convert WebP to PNG?", "Upload WebP files and use Convert to PNG."],
      ["Is conversion local?", "Yes, files stay on your device during processing."],
      ["Can I download files individually?", "Yes, per-file download and batch download are both supported."],
      ["Do I need account login?", "No login required."]
    ]
  },
  {
    slug: "compress",
    title: "Image Compressor",
    description: "Compress images online with adjustable quality from 1 to 100. Fast client-side image compressor with no upload required.",
    keywords: "image compressor,compress image online,reduce image size,image optimization tool",
    howto:
      "Upload images, choose quality from 1 to 100, compress files, and download optimized output. Useful for SEO page speed and faster uploads.",
    faq: [
      ["How does image compression work?", "The tool re-encodes images in your browser at your selected quality level."],
      ["Can I control quality?", "Yes, you can choose quality from 1 to 100."],
      ["What formats are supported?", "JPG, PNG, and WebP input are supported."],
      ["Why use compression for SEO?", "Smaller images improve loading speed and user experience."]
    ]
  },
  {
    slug: "resize",
    title: "Image Resizer",
    description: "Resize images by setting custom width and height. Fast client-side image resizer with instant download.",
    keywords: "image resizer,resize image online,change image size,width height image tool",
    howto:
      "Upload an image, set width and height, keep aspect ratio if needed, and download the resized result. Great for thumbnails, social posts, and web assets.",
    faq: [
      ["Can I set custom dimensions?", "Yes, enter exact width and height values."],
      ["Can I keep original ratio?", "Yes, enable keep ratio to preserve proportions."],
      ["Does it work on mobile?", "Yes, the resizer is responsive."],
      ["Is this tool free?", "Yes, free to use."]
    ]
  },
  {
    slug: "crop",
    title: "Image Cropper",
    description: "Crop images visually by selecting a custom crop region and download the cropped result instantly.",
    keywords: "image cropper,crop image online,crop photo,free crop tool",
    howto:
      "Upload an image, drag to select crop area visually, crop image, and download. Use it to focus on important content and remove unwanted edges.",
    faq: [
      ["How do I crop an image?", "Upload an image, draw crop selection, and click Crop Image."],
      ["Can I preview before download?", "Yes, cropped preview appears before download."],
      ["Does crop happen in browser?", "Yes, 100% client-side."],
      ["Can I crop JPG, PNG, and WebP?", "Yes, common image formats are supported."]
    ]
  },
  {
    slug: "image-to-pdf",
    title: "Image to PDF Converter",
    description: "Convert multiple images into one PDF file online. Fast, secure, and fully client-side image to PDF conversion.",
    keywords: "image to pdf,jpg to pdf,png to pdf,convert images to pdf online",
    howto:
      "Upload multiple images, keep order, convert to a single PDF, and download. Ideal for reports, assignments, and documentation.",
    faq: [
      ["Can I upload multiple images?", "Yes, multiple images are supported in one PDF output."],
      ["How are pages ordered?", "Pages follow the order of selected/uploaded images."],
      ["Is my data private?", "Yes, conversion is done in browser using Web APIs."],
      ["Do I need software installation?", "No, it works directly in browser."]
    ]
  }
];

const homeFaq = [
  ["What is the best free image converter online?", "This site offers JPG, PNG, and WebP converters plus compressor, resize, crop, and image to PDF in one place."],
  ["Are these tools secure for private files?", "Yes. Processing is client-side, so your images do not need to be uploaded to a conversion server."],
  ["Can I convert images in bulk?", "Yes. Most converter tools support multiple file upload and download."],
  ["Can this website rank for keywords like jpg topng, png to jpg, image compressor?", "Yes, each tool page is optimized for dedicated service keywords and long-tail search intent."]
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content, "utf8");
}

function cleanSection(html, start, end) {
  const regex = new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, "g");
  return html.replace(regex, "\n");
}

function escapeJson(text) {
  return String(text).replace(/"/g, '\\"');
}

function renderFaqDetails(faq) {
  return faq
    .map(function (item) {
      return (
        '<details class="rounded-xl border border-slate-200 bg-slate-50 p-4">' +
        '<summary class="cursor-pointer text-sm font-semibold text-slate-900">' + item[0] + "</summary>" +
        '<p class="mt-2 text-sm text-slate-600">' + item[1] + "</p>" +
        "</details>"
      );
    })
    .join("");
}

function renderFaqSchema(faq) {
  return faq
    .map(function (item) {
      return (
        '{ "@type": "Question", "name": "' + escapeJson(item[0]) + '", "acceptedAnswer": { "@type": "Answer", "text": "' + escapeJson(item[1]) + '" } }'
      );
    })
    .join(", ");
}

function updateHeadMeta(html, meta) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + meta.title + "</title>");
  html = html.replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/, '<meta name="description" content="' + meta.description + '" />');

  if (/<meta\s+name="keywords"/.test(html)) {
    html = html.replace(/<meta\s+name="keywords"\s+content="[\s\S]*?"\s*\/>/, '<meta name="keywords" content="' + meta.keywords + '" />');
  } else {
    html = html.replace(/<meta\s+name="description"[\s\S]*?\/>/, function (m) {
      return m + '\n  <meta name="keywords" content="' + meta.keywords + '" />';
    });
  }

  if (/<link\s+rel="canonical"/.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/>/, '<link rel="canonical" href="' + meta.canonical + '" />');
  } else {
    html = html.replace(/<\/head>/, '  <link rel="canonical" href="' + meta.canonical + '" />\n</head>');
  }

  html = html.replace(/<meta\s+property="og:title"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+property="og:description"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+property="og:url"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+property="og:type"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+name="twitter:title"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+name="twitter:description"[\s\S]*?\/>\n?/g, "");
  html = html.replace(/<meta\s+name="twitter:card"[\s\S]*?\/>\n?/g, "");

  const social = [
    '  <meta property="og:type" content="website" />',
    '  <meta property="og:title" content="' + meta.title + '" />',
    '  <meta property="og:description" content="' + meta.description + '" />',
    '  <meta property="og:url" content="' + meta.canonical + '" />',
    '  <meta name="twitter:card" content="summary_large_image" />',
    '  <meta name="twitter:title" content="' + meta.title + '" />',
    '  <meta name="twitter:description" content="' + meta.description + '" />'
  ].join("\n");

  if (/<meta\s+name="theme-color"/.test(html)) {
    html = html.replace(/<meta\s+name="theme-color"[\s\S]*?\/>/, function (m) {
      return m + "\n" + social;
    });
  } else {
    html = html.replace(/<\/head>/, social + "\n</head>");
  }

  return html;
}

function updateHome() {
  let html = read("index.html");
  html = html.replace(/https:\/\/your-domain\.com/g, DOMAIN);
  html = cleanSection(html, "<!-- SEO-HOME-CONTENT-START -->", "<!-- SEO-HOME-CONTENT-END -->");
  html = cleanSection(html, "<!-- SEO-HOME-JSONLD-START -->", "<!-- SEO-HOME-JSONLD-END -->");

  html = updateHeadMeta(html, {
    title: "Image Tools Hub - JPG to PNG, PNG to JPG, WebP Converter, Compressor, Resizer, Cropper, Image to PDF",
    description:
      "Free online image tools: JPG to PNG, PNG to JPG, JPG to WebP, PNG to WebP, WebP converters, image compressor, image resizer, image cropper, and image to PDF.",
    keywords:
      "jpg to png,png to jpg,jpg to webp,png to webp,webp to jpg,webp to png,image compressor,image resizer,image cropper,image to pdf,jpg topng",
    canonical: DOMAIN + "/"
  });

  const jsonLd = `
  <!-- SEO-HOME-JSONLD-START -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Image Tools Hub",
      "url": "${DOMAIN}/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "${DOMAIN}/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  </script>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Image Tools Hub",
      "url": "${DOMAIN}/",
      "logo": "${DOMAIN}/assets/logo.svg"
    }
  </script>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${renderFaqSchema(homeFaq)}]
    }
  </script>
  <!-- SEO-HOME-JSONLD-END -->`;
  html = html.replace("</head>", jsonLd + "\n</head>");

  const seoContent = `
      <!-- SEO-HOME-CONTENT-START -->
      <section class="mt-6 rounded-[24px] border border-slate-100 bg-white p-5 shadow-card sm:p-7 lg:col-span-2">
        <h2 class="text-2xl font-bold text-slate-900">Best Free Image Converter Tools Online</h2>
        <p class="mt-3 text-sm leading-7 text-slate-600">
          This website provides fast image conversion and optimization tools for creators, students, developers, and businesses.
          You can convert JPG to PNG, PNG to JPG, JPG to WebP, PNG to WebP, WebP to JPG, WebP to PNG, compress images, resize images,
          crop photos, and combine images into PDF files. All tools run client-side using Canvas and Web APIs.
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" href="${DOMAIN}/tools/jpg-to-png/">JPG to PNG Converter</a>
          <a class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" href="${DOMAIN}/tools/png-to-jpg/">PNG to JPG Converter</a>
          <a class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" href="${DOMAIN}/tools/image-to-pdf/">Image to PDF Converter</a>
          <a class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" href="${DOMAIN}/tools/compress/">Image Compressor</a>
        </div>
        <h3 class="mt-6 text-xl font-bold text-slate-900">Frequently Asked Questions</h3>
        <div class="mt-3 space-y-3">
          ${renderFaqDetails(homeFaq)}
        </div>
      </section>
      <!-- SEO-HOME-CONTENT-END -->`;
  html = html.replace("</main>", seoContent + "\n    </main>");

  write("index.html", html);
}

function updateToolPage(tool) {
  const file = path.join("tools", tool.slug, "index.html");
  let html = read(file);
  html = html.replace(/https:\/\/your-domain\.com/g, DOMAIN);
  html = cleanSection(html, "<!-- SEO-TOOL-CONTENT-START -->", "<!-- SEO-TOOL-CONTENT-END -->");
  html = cleanSection(html, "<!-- SEO-TOOL-JSONLD-START -->", "<!-- SEO-TOOL-JSONLD-END -->");

  html = updateHeadMeta(html, {
    title: tool.title + " - Free Online Tool",
    description: tool.description,
    keywords: tool.keywords,
    canonical: DOMAIN + "/tools/" + tool.slug + "/"
  });

  const jsonLd = `
  <!-- SEO-TOOL-JSONLD-START -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${tool.title}",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Any",
      "url": "${DOMAIN}/tools/${tool.slug}/",
      "description": "${escapeJson(tool.description)}",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  </script>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "${DOMAIN}/" },
        { "@type": "ListItem", "position": 2, "name": "Tools", "item": "${DOMAIN}/" },
        { "@type": "ListItem", "position": 3, "name": "${escapeJson(tool.title)}", "item": "${DOMAIN}/tools/${tool.slug}/" }
      ]
    }
  </script>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${renderFaqSchema(tool.faq)}]
    }
  </script>
  <!-- SEO-TOOL-JSONLD-END -->`;
  html = html.replace("</head>", jsonLd + "\n</head>");

  const seoContent = `
      <!-- SEO-TOOL-CONTENT-START -->
      <section class="mt-6 rounded-[24px] border border-slate-100 bg-white p-5 shadow-card sm:p-7 lg:col-span-2">
        <h2 class="text-2xl font-bold text-slate-900">${tool.title} - How It Works</h2>
        <p class="mt-3 text-sm leading-7 text-slate-600">${tool.howto}</p>
        <h3 class="mt-6 text-xl font-bold text-slate-900">FAQ</h3>
        <div class="mt-3 space-y-3">
          ${renderFaqDetails(tool.faq)}
        </div>
        <div class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p><strong>Related tools:</strong> <a class="font-semibold text-[#0066ff]" href="${DOMAIN}/tools/jpg-to-png/">JPG to PNG</a>, <a class="font-semibold text-[#0066ff]" href="${DOMAIN}/tools/png-to-jpg/">PNG to JPG</a>, <a class="font-semibold text-[#0066ff]" href="${DOMAIN}/tools/image-to-pdf/">Image to PDF</a>, <a class="font-semibold text-[#0066ff]" href="${DOMAIN}/tools/compress/">Image Compressor</a>.</p>
        </div>
      </section>
      <!-- SEO-TOOL-CONTENT-END -->`;
  html = html.replace("</main>", seoContent + "\n    </main>");

  write(file, html);
}

function updateLegal(file, title, desc) {
  let html = read(file);
  html = html.replace(/https:\/\/your-domain\.com/g, DOMAIN);
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + title + "</title>");
  html = html.replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/, '<meta name="description" content="' + desc + '" />');
  if (/<link\s+rel="canonical"/.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/>/, '<link rel="canonical" href="' + DOMAIN + "/" + path.basename(file) + '" />');
  }
  write(file, html);
}

function updateRobotsAndSitemap() {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  write("robots.txt", robots);

  const urls = ["/"]
    .concat(tools.map(function (tool) { return "/tools/" + tool.slug + "/"; }))
    .concat(["/privacy-policy.html", "/terms.html"]);

  const xmlItems = urls
    .map(function (url) {
      const priority = url === "/" ? "1.0" : url.indexOf("/tools/") === 0 ? "0.9" : "0.4";
      const freq = url.indexOf("/tools/") === 0 || url === "/" ? "weekly" : "monthly";
      return (
        "  <url>\n" +
        "    <loc>" + DOMAIN + url + "</loc>\n" +
        "    <lastmod>" + TODAY + "</lastmod>\n" +
        "    <changefreq>" + freq + "</changefreq>\n" +
        "    <priority>" + priority + "</priority>\n" +
        "  </url>"
      );
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>\n`;
  write("sitemap.xml", sitemap);
}

function run() {
  updateHome();
  tools.forEach(updateToolPage);
  updateLegal("privacy-policy.html", "Privacy Policy | Image Tools Hub", "Privacy policy for Image Tools Hub and all image converter services.");
  updateLegal("terms.html", "Terms of Use | Image Tools Hub", "Terms of use for Image Tools Hub, including converters, compressor, cropper, and PDF tools.");
  updateRobotsAndSitemap();
  console.log("SEO upgrade complete.");
}

run();
