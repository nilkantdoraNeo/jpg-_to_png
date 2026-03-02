"use strict";

window.initImageToPdfTool = function initImageToPdfTool() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const convertBtn = document.getElementById("convertBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const previewGrid = document.getElementById("previewGrid");
  const fileCount = document.getElementById("fileCount");

  if (!dropZone || !fileInput || !convertBtn || !downloadBtn || !clearBtn || !statusMessage || !previewGrid || !fileCount) {
    return;
  }

  const state = {
    files: [],
    pdfBlob: null,
    pdfUrl: "",
    pdfName: "images.pdf",
    building: false,
    dragDepth: 0
  };

  function showStatus(text, type) {
    if (!text) {
      statusMessage.className = "hidden";
      statusMessage.textContent = "";
      return;
    }

    const map = {
      info: "mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700",
      success: "mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700",
      error: "mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
    };

    statusMessage.className = map[type] || map.info;
    statusMessage.textContent = text;
  }

  function setButtons() {
    convertBtn.disabled = !state.files.length || state.building;
    downloadBtn.disabled = !state.pdfBlob || state.building;
    clearBtn.disabled = !state.files.length && !state.pdfBlob;

    [convertBtn, downloadBtn, clearBtn].forEach(function (btn) {
      btn.classList.toggle("opacity-50", btn.disabled);
      btn.classList.toggle("pointer-events-none", btn.disabled);
    });
  }

  function fileKey(file) {
    return file.name + "__" + file.size + "__" + file.lastModified;
  }

  function emptyPreview() {
    previewGrid.innerHTML = '<div class="rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Images will appear here.</div>';
  }

  function render() {
    fileCount.textContent = state.files.length + " file" + (state.files.length === 1 ? "" : "s") + " selected";

    if (!state.files.length) {
      emptyPreview();
      return;
    }

    previewGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    state.files.forEach(function (file, index) {
      const url = URL.createObjectURL(file);
      const card = document.createElement("article");
      card.className = "preview-card";
      card.innerHTML =
        '<img src="' + url + '" class="preview-thumb" alt="' + file.name.replace(/"/g, "") + '" loading="lazy" />' +
        '<div class="space-y-2 p-3">' +
        '<p class="truncate text-sm font-semibold text-slate-900" title="' + file.name.replace(/"/g, "") + '">' + file.name + "</p>" +
        '<p class="text-xs text-slate-500">Page ' + (index + 1) + "</p>" +
        "</div>";

      const img = card.querySelector("img");
      img.addEventListener("load", function () {
        URL.revokeObjectURL(url);
      }, { once: true });
      img.addEventListener("error", function () {
        URL.revokeObjectURL(url);
      }, { once: true });

      fragment.appendChild(card);
    });

    previewGrid.appendChild(fragment);
  }

  function revokePdf() {
    if (state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = "";
    }
    state.pdfBlob = null;
  }

  function mergeFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const known = new Set(state.files.map(fileKey));
    let added = 0;
    let invalid = 0;

    incoming.forEach(function (file) {
      if (!(file.type || "").startsWith("image/")) {
        invalid += 1;
        return;
      }
      const k = fileKey(file);
      if (known.has(k)) return;
      known.add(k);
      state.files.push(file);
      added += 1;
    });

    if (added) {
      revokePdf();
      render();
      showStatus(added + " image(s) ready for PDF conversion.", "success");
    }

    if (!added && invalid) {
      showStatus("Please upload valid image files.", "error");
    }

    setButtons();
    fileInput.value = "";
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error("Failed to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("Failed to load image."));
      };
      image.src = dataUrl;
    });
  }

  async function buildPdf() {
    if (!state.files.length || state.building) {
      if (!state.files.length) showStatus("Upload images before conversion.", "error");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showStatus("PDF library failed to load. Check internet connection and retry.", "error");
      return;
    }

    state.building = true;
    setButtons();

    const jsPDF = window.jspdf.jsPDF;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < state.files.length; i += 1) {
      const file = state.files[i];
      showStatus("Converting image " + (i + 1) + " of " + state.files.length + "...", "info");

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const image = await loadImage(dataUrl);

        const maxWidth = pageWidth - 20;
        const maxHeight = pageHeight - 20;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        const drawWidth = image.width * ratio;
        const drawHeight = image.height * ratio;
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        if (i > 0) pdf.addPage();

        const format = file.type === "image/png" ? "PNG" : "JPEG";
        pdf.addImage(dataUrl, format, x, y, drawWidth, drawHeight, undefined, "FAST");
      } catch (error) {
      }
    }

    const blob = pdf.output("blob");
    revokePdf();

    state.pdfBlob = blob;
    state.pdfUrl = URL.createObjectURL(blob);
    state.pdfName = "images-" + Date.now() + ".pdf";

    state.building = false;
    setButtons();
    showStatus("PDF generated successfully. Click Download PDF.", "success");
  }

  function downloadPdf() {
    if (!state.pdfBlob || !state.pdfUrl) {
      showStatus("No PDF generated yet.", "error");
      return;
    }

    const link = document.createElement("a");
    link.href = state.pdfUrl;
    link.download = state.pdfName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearAll() {
    state.files = [];
    state.building = false;
    revokePdf();
    render();
    setButtons();
    showStatus("Cleared.", "info");
  }

  dropZone.addEventListener("click", function () {
    fileInput.click();
  });

  dropZone.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", function (event) {
    mergeFiles(event.target.files);
  });

  dropZone.addEventListener("dragenter", function (event) {
    event.preventDefault();
    state.dragDepth += 1;
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", function (event) {
    event.preventDefault();
    state.dragDepth = Math.max(0, state.dragDepth - 1);
    if (!state.dragDepth) dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();
    state.dragDepth = 0;
    dropZone.classList.remove("drag-over");
    mergeFiles(event.dataTransfer.files);
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (eventName) {
    document.body.addEventListener(eventName, function (event) {
      event.preventDefault();
    });
  });

  convertBtn.addEventListener("click", buildPdf);
  downloadBtn.addEventListener("click", downloadPdf);
  clearBtn.addEventListener("click", clearAll);

  render();
  setButtons();
  showStatus("Upload multiple images and convert them into one PDF.", "info");
};
