"use strict";

window.initConverterTool = function initConverterTool() {
  const CONFIG = window.TOOL_CONFIG || {};
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
    converted: [],
    converting: false,
    dragDepth: 0
  };

  function bytesLabel(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function status(text, type) {
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
    convertBtn.disabled = state.files.length === 0 || state.converting;
    downloadBtn.disabled = state.converted.length === 0 || state.converting;
    clearBtn.disabled = state.files.length === 0 && state.converted.length === 0;

    [convertBtn, downloadBtn, clearBtn].forEach(function (btn) {
      btn.classList.toggle("opacity-50", btn.disabled);
      btn.classList.toggle("pointer-events-none", btn.disabled);
    });
  }

  function accepted(file) {
    if (!file) return false;
    const mime = (file.type || "").toLowerCase();
    const name = file.name || "";

    if (Array.isArray(CONFIG.inputMimes) && CONFIG.inputMimes.includes(mime)) {
      return true;
    }

    if (CONFIG.inputExtRegex instanceof RegExp) {
      return CONFIG.inputExtRegex.test(name);
    }

    return false;
  }

  function key(file) {
    return file.name + "__" + file.size + "__" + file.lastModified;
  }

  function getConverted(file) {
    const k = key(file);
    return state.converted.find(function (item) {
      return item.key === k;
    });
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

    const fragment = document.createDocumentFragment();
    previewGrid.innerHTML = "";

    state.files.forEach(function (file) {
      const converted = getConverted(file);
      const objectUrl = URL.createObjectURL(file);
      const card = document.createElement("article");
      card.className = "preview-card";
      card.innerHTML =
        '<img src="' + objectUrl + '" class="preview-thumb" alt="' + file.name.replace(/"/g, "") + '" loading="lazy" />' +
        '<div class="space-y-2 p-3">' +
        '<p class="truncate text-sm font-semibold text-slate-900" title="' + file.name.replace(/"/g, "") + '">' + file.name + "</p>" +
        '<p class="text-xs text-slate-500">' + bytesLabel(file.size) + "</p>" +
        '<div class="flex items-center justify-between gap-2">' +
        (converted
          ? '<span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Ready</span>'
          : '<span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Source</span>') +
        (converted
          ? '<button type="button" data-download="' + encodeURIComponent(converted.key) + '" class="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#0066ff] hover:border-blue-400">Download</button>'
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

  function mergeFiles(list) {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;

    const seen = new Set(state.files.map(key));
    let added = 0;
    let rejected = 0;

    incoming.forEach(function (file) {
      if (!accepted(file)) {
        rejected += 1;
        return;
      }
      const k = key(file);
      if (seen.has(k)) return;
      seen.add(k);
      state.files.push(file);
      added += 1;
    });

    if (added) {
      state.converted = [];
      render();
      status(added + " file(s) ready for conversion.", "success");
    }

    if (!added && rejected) {
      status("Unsupported file type. Please upload only valid source files.", "error");
    }

    setButtons();
    fileInput.value = "";
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to load image."));
      };
      image.src = url;
    });
  }

  function convertFile(file) {
    return loadImage(file).then(function (image) {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable.");

      if (CONFIG.fillWhiteBackground) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(image, 0, 0);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error("Conversion failed."));
            return;
          }
          resolve(blob);
        }, CONFIG.outputMime, CONFIG.exportQuality);
      });
    });
  }

  function outputName(name) {
    return name.replace(/\.[^.]+$/, "") + "." + CONFIG.outputExt;
  }

  function triggerDownload(file) {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1200);
  }

  async function convertAll() {
    if (!state.files.length || state.converting) {
      if (!state.files.length) status("Upload at least one image first.", "error");
      return;
    }

    state.converting = true;
    setButtons();

    const results = [];
    const failed = [];

    for (let i = 0; i < state.files.length; i += 1) {
      const file = state.files[i];
      status("Converting " + (i + 1) + " of " + state.files.length + "...", "info");
      try {
        const blob = await convertFile(file);
        results.push({
          key: key(file),
          blob: blob,
          name: outputName(file.name)
        });
      } catch (error) {
        failed.push(file.name);
      }
    }

    state.converted = results;
    state.converting = false;
    render();
    setButtons();

    if (!results.length) {
      status("Conversion failed for all files.", "error");
      return;
    }

    if (failed.length) {
      status("Converted " + results.length + " file(s). " + failed.length + " failed.", "info");
      return;
    }

    status("Converted " + results.length + " file(s) successfully.", "success");
  }

  function downloadAll() {
    if (!state.converted.length) {
      status("No converted file found. Convert first.", "error");
      return;
    }

    state.converted.forEach(function (file, index) {
      setTimeout(function () {
        triggerDownload(file);
      }, index * 140);
    });

    status("Download started for " + state.converted.length + " file(s).", "success");
  }

  function clearAll() {
    state.files = [];
    state.converted = [];
    state.converting = false;
    render();
    setButtons();
    status("All files cleared.", "info");
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

  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (name) {
    document.body.addEventListener(name, function (event) {
      event.preventDefault();
    });
  });

  convertBtn.addEventListener("click", convertAll);
  downloadBtn.addEventListener("click", downloadAll);
  clearBtn.addEventListener("click", clearAll);

  previewGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-download]");
    if (!button) return;

    const keyValue = decodeURIComponent(button.getAttribute("data-download"));
    const file = state.converted.find(function (item) {
      return item.key === keyValue;
    });

    if (!file) {
      status("File is not available.", "error");
      return;
    }

    triggerDownload(file);
  });

  render();
  setButtons();
  status("Upload files to start conversion.", "info");
};
