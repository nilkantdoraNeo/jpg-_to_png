"use strict";

window.initCompressTool = function initCompressTool() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const qualityRange = document.getElementById("qualityRange");
  const qualityValue = document.getElementById("qualityValue");
  const compressBtn = document.getElementById("compressBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const previewGrid = document.getElementById("previewGrid");
  const fileCount = document.getElementById("fileCount");

  if (!dropZone || !fileInput || !qualityRange || !qualityValue || !compressBtn || !downloadBtn || !clearBtn || !statusMessage || !previewGrid || !fileCount) {
    return;
  }

  const state = {
    files: [],
    compressed: [],
    processing: false,
    dragDepth: 0
  };

  function bytesLabel(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

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

  function fileKey(file) {
    return file.name + "__" + file.size + "__" + file.lastModified;
  }

  function findCompressed(file) {
    const k = fileKey(file);
    return state.compressed.find(function (item) {
      return item.key === k;
    });
  }

  function setButtons() {
    compressBtn.disabled = !state.files.length || state.processing;
    downloadBtn.disabled = !state.compressed.length || state.processing;
    clearBtn.disabled = !state.files.length && !state.compressed.length;

    [compressBtn, downloadBtn, clearBtn].forEach(function (btn) {
      btn.classList.toggle("opacity-50", btn.disabled);
      btn.classList.toggle("pointer-events-none", btn.disabled);
    });
  }

  function isSupported(file) {
    const mime = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    return mime.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(name);
  }

  function outputConfig(file) {
    const mime = (file.type || "").toLowerCase();
    if (mime === "image/png") return { mime: "image/webp", ext: "webp" };
    if (mime === "image/webp") return { mime: "image/webp", ext: "webp" };
    return { mime: "image/jpeg", ext: "jpg" };
  }

  function emptyPreview() {
    previewGrid.innerHTML = '<div class="rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Files will appear here.</div>';
  }

  function render() {
    fileCount.textContent = state.files.length + " file" + (state.files.length === 1 ? "" : "s") + " selected";
    if (!state.files.length) {
      emptyPreview();
      return;
    }

    previewGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    state.files.forEach(function (file) {
      const compressed = findCompressed(file);
      const objectUrl = URL.createObjectURL(file);
      const card = document.createElement("article");
      card.className = "preview-card";

      let details = '<p class="text-xs text-slate-500">Original: ' + bytesLabel(file.size) + "</p>";
      if (compressed) {
        const saved = Math.max(0, file.size - compressed.blob.size);
        details += '<p class="text-xs font-semibold text-emerald-700">Compressed: ' + bytesLabel(compressed.blob.size) + " (Saved " + bytesLabel(saved) + ")</p>";
      }

      card.innerHTML =
        '<img src="' + objectUrl + '" class="preview-thumb" alt="' + file.name.replace(/"/g, "") + '" loading="lazy" />' +
        '<div class="space-y-2 p-3">' +
        '<p class="truncate text-sm font-semibold text-slate-900" title="' + file.name.replace(/"/g, "") + '">' + file.name + "</p>" +
        details +
        '<div class="flex items-center justify-between gap-2">' +
        (compressed
          ? '<span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Compressed</span>'
          : '<span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Source</span>') +
        (compressed
          ? '<button type="button" data-download="' + encodeURIComponent(compressed.key) + '" class="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#0066ff] hover:border-blue-400">Download</button>'
          : '<span class="text-xs text-slate-400">Pending</span>') +
        "</div></div>";

      const img = card.querySelector("img");
      img.addEventListener("load", function () {
        URL.revokeObjectURL(objectUrl);
      }, { once: true });
      img.addEventListener("error", function () {
        URL.revokeObjectURL(objectUrl);
      }, { once: true });

      fragment.appendChild(card);
    });

    previewGrid.appendChild(fragment);
  }

  function mergeFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const known = new Set(state.files.map(fileKey));
    let added = 0;
    let invalid = 0;

    incoming.forEach(function (file) {
      if (!isSupported(file)) {
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
      state.compressed = [];
      render();
      showStatus(added + " file(s) ready for compression.", "success");
    }

    if (!added && invalid) {
      showStatus("Please upload valid image files.", "error");
    }

    setButtons();
    fileInput.value = "";
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to load image."));
      };
      img.src = url;
    });
  }

  function compressFile(file, quality) {
    return loadImage(file).then(function (img) {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable.");

      const out = outputConfig(file);
      if (out.mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error("Compression failed."));
            return;
          }
          resolve({ blob: blob, ext: out.ext });
        }, out.mime, quality);
      });
    });
  }

  function outputName(fileName, ext) {
    return fileName.replace(/\.[^.]+$/, "") + "-compressed." + ext;
  }

  function downloadItem(item) {
    const url = URL.createObjectURL(item.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1300);
  }

  async function compressAll() {
    if (!state.files.length || state.processing) {
      if (!state.files.length) showStatus("Upload images before compressing.", "error");
      return;
    }

    state.processing = true;
    setButtons();

    const quality = Number(qualityRange.value) / 100;
    const results = [];
    let originalTotal = 0;
    let compressedTotal = 0;

    for (let i = 0; i < state.files.length; i += 1) {
      const file = state.files[i];
      showStatus("Compressing " + (i + 1) + " of " + state.files.length + "...", "info");
      try {
        const result = await compressFile(file, quality);
        originalTotal += file.size;
        compressedTotal += result.blob.size;
        results.push({
          key: fileKey(file),
          blob: result.blob,
          name: outputName(file.name, result.ext)
        });
      } catch (error) {
      }
    }

    state.compressed = results;
    state.processing = false;
    render();
    setButtons();

    if (!results.length) {
      showStatus("Compression failed. Try another file.", "error");
      return;
    }

    const saved = Math.max(0, originalTotal - compressedTotal);
    const percent = originalTotal ? ((saved / originalTotal) * 100).toFixed(1) : "0.0";
    showStatus("Compressed " + results.length + " file(s). Saved: " + bytesLabel(saved) + " (" + percent + "%).", "success");
  }

  function downloadAll() {
    if (!state.compressed.length) {
      showStatus("Nothing to download. Compress files first.", "error");
      return;
    }

    state.compressed.forEach(function (item, idx) {
      setTimeout(function () {
        downloadItem(item);
      }, idx * 140);
    });

    showStatus("Download started for " + state.compressed.length + " file(s).", "success");
  }

  function clearAll() {
    state.files = [];
    state.compressed = [];
    state.processing = false;
    render();
    setButtons();
    showStatus("All files cleared.", "info");
  }

  qualityRange.addEventListener("input", function () {
    qualityValue.textContent = qualityRange.value;
  });

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

  compressBtn.addEventListener("click", compressAll);
  downloadBtn.addEventListener("click", downloadAll);
  clearBtn.addEventListener("click", clearAll);

  previewGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-download]");
    if (!button) return;

    const keyValue = decodeURIComponent(button.getAttribute("data-download"));
    const item = state.compressed.find(function (entry) {
      return entry.key === keyValue;
    });

    if (item) downloadItem(item);
  });

  render();
  setButtons();
  showStatus("Upload images and set quality to begin compression.", "info");
};
