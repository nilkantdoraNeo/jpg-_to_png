"use strict";

(function () {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const convertBtn = document.getElementById("convertBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const previewGrid = document.getElementById("previewGrid");
  const fileCount = document.getElementById("fileCount");
  const convertButtonText = document.getElementById("convertButtonText");

  if (
    !dropZone ||
    !fileInput ||
    !convertBtn ||
    !downloadBtn ||
    !clearBtn ||
    !statusMessage ||
    !previewGrid ||
    !fileCount ||
    !convertButtonText
  ) {
    return;
  }

  const state = {
    selectedFiles: [],
    convertedFiles: [],
    isConverting: false,
    dragDepth: 0
  };

  const STATUS_STYLE = {
    info: "border-blue-100 bg-blue-50 text-blue-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
    error: "border-red-100 bg-red-50 text-red-700"
  };

  function fileKey(file) {
    return [file.name, file.size, file.lastModified].join("__");
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    const formatted = value >= 10 ? value.toFixed(1) : value.toFixed(2);
    return formatted.replace(/\.0+$/, "") + " " + units[unitIndex];
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return String(text).replace(/[&<>"']/g, function (char) {
      return map[char];
    });
  }

  function showStatus(message, type) {
    if (!message) {
      statusMessage.classList.add("hidden");
      statusMessage.textContent = "";
      return;
    }

    const safeType = STATUS_STYLE[type] ? type : "info";
    statusMessage.className =
      "mt-4 rounded-2xl border px-4 py-3 text-sm font-medium " + STATUS_STYLE[safeType];
    statusMessage.textContent = message;
    statusMessage.classList.remove("hidden");
  }

  function setDropHighlight(active) {
    dropZone.classList.toggle("border-[#0066ff]", active);
    dropZone.classList.toggle("bg-blue-50", active);
    dropZone.classList.toggle("ring-4", active);
    dropZone.classList.toggle("ring-blue-100", active);
    dropZone.classList.toggle("scale-[1.01]", active);
  }

  function setButtonState(button, disabled) {
    button.disabled = disabled;
    button.classList.toggle("opacity-50", disabled);
    button.classList.toggle("cursor-not-allowed", disabled);
    button.classList.toggle("pointer-events-none", disabled);
  }

  function updateButtons() {
    const hasFiles = state.selectedFiles.length > 0;
    const hasConverted = state.convertedFiles.length > 0;

    setButtonState(convertBtn, !hasFiles || state.isConverting);
    setButtonState(downloadBtn, !hasConverted || state.isConverting);
    setButtonState(clearBtn, !hasFiles && !hasConverted && !state.isConverting);
    convertButtonText.textContent = state.isConverting ? "Converting..." : "Convert to PNG";
  }

  function isJpgFile(file) {
    if (!file) {
      return false;
    }

    const mime = (file.type || "").toLowerCase();
    const name = file.name || "";

    return mime === "image/jpeg" || /\.jpe?g$/i.test(name);
  }

  function clearPreviewGrid() {
    previewGrid.innerHTML = "";
  }

  function showEmptyPreview() {
    previewGrid.innerHTML =
      '<div class="col-span-full rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">JPG previews will appear here.</div>';
  }

  function findConvertedByKey(key) {
    return state.convertedFiles.find(function (item) {
      return item.key === key;
    });
  }

  function renderPreviews() {
    fileCount.textContent = state.selectedFiles.length + " file" + (state.selectedFiles.length === 1 ? "" : "s") + " selected";
    clearPreviewGrid();

    if (state.selectedFiles.length === 0) {
      showEmptyPreview();
      return;
    }

    const fragment = document.createDocumentFragment();

    state.selectedFiles.forEach(function (file) {
      const key = fileKey(file);
      const converted = findConvertedByKey(key);
      const card = document.createElement("article");
      const imageUrl = URL.createObjectURL(file);
      const encodedKey = encodeURIComponent(key);
      const statusBadge = converted
        ? '<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Converted</span>'
        : '<span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Ready</span>';
      const singleDownloadButton = converted
        ? '<button type="button" data-download-key="' +
          encodedKey +
          '" class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0066ff] transition hover:border-blue-400">PNG</button>'
        : '<span class="text-xs text-slate-400">Not converted</span>';

      card.className = "overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md";
      card.innerHTML =
        '<div class="aspect-[4/3] bg-slate-100">' +
        '<img src="' +
        imageUrl +
        '" alt="' +
        escapeHtml(file.name) +
        '" class="h-full w-full object-cover" loading="lazy" />' +
        "</div>" +
        '<div class="space-y-2 p-3">' +
        '<p class="truncate text-sm font-semibold text-slate-900" title="' +
        escapeHtml(file.name) +
        '">' +
        escapeHtml(file.name) +
        "</p>" +
        '<p class="text-xs text-slate-500">JPG - ' +
        formatBytes(file.size) +
        "</p>" +
        '<div class="flex items-center justify-between gap-2">' +
        statusBadge +
        singleDownloadButton +
        "</div>" +
        "</div>";

      const previewImg = card.querySelector("img");
      previewImg.addEventListener(
        "load",
        function () {
          URL.revokeObjectURL(imageUrl);
        },
        { once: true }
      );
      previewImg.addEventListener(
        "error",
        function () {
          URL.revokeObjectURL(imageUrl);
        },
        { once: true }
      );

      fragment.appendChild(card);
    });

    previewGrid.appendChild(fragment);
  }

  function mergeFiles(filesList) {
    const incoming = Array.from(filesList || []);

    if (incoming.length === 0) {
      return;
    }

    const existing = new Set(
      state.selectedFiles.map(function (file) {
        return fileKey(file);
      })
    );

    let added = 0;
    let invalid = 0;
    let duplicates = 0;

    incoming.forEach(function (file) {
      if (!isJpgFile(file)) {
        invalid += 1;
        return;
      }

      const key = fileKey(file);
      if (existing.has(key)) {
        duplicates += 1;
        return;
      }

      state.selectedFiles.push(file);
      existing.add(key);
      added += 1;
    });

    if (added > 0) {
      state.convertedFiles = [];
      renderPreviews();
      updateButtons();
    }

    if (added > 0 && invalid > 0) {
      showStatus(added + " JPG file(s) added. " + invalid + " invalid file(s) skipped.", "info");
    } else if (added > 0 && duplicates > 0) {
      showStatus(added + " JPG file(s) added. " + duplicates + " duplicate file(s) ignored.", "info");
    } else if (added > 0) {
      showStatus(added + " JPG file(s) ready for conversion.", "success");
    } else if (invalid > 0) {
      showStatus("Only JPG/JPEG files are supported.", "error");
    } else if (duplicates > 0) {
      showStatus("All selected files are duplicates.", "info");
    }

    fileInput.value = "";
    updateButtons();
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = function () {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to read image: " + file.name));
      };

      image.src = objectUrl;
    });
  }

  function convertJpgToPng(file) {
    return loadImage(file).then(function (image) {
      const canvas = document.createElement("canvas");
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas is not supported in this browser.");
      }

      context.drawImage(image, 0, 0);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(
          function (blob) {
            if (!blob) {
              reject(new Error("Failed to create PNG blob."));
              return;
            }
            resolve(blob);
          },
          "image/png",
          1
        );
      });
    });
  }

  function getOutputName(fileName) {
    return fileName.replace(/\.[^/.]+$/, "") + ".png";
  }

  function triggerDownloads(files) {
    files.forEach(function (file, index) {
      setTimeout(function () {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 2000);
      }, index * 120);
    });
  }

  async function convertAll() {
    if (state.isConverting) {
      return;
    }

    if (state.selectedFiles.length === 0) {
      showStatus("No image selected. Please upload at least one JPG file.", "error");
      return;
    }

    state.isConverting = true;
    updateButtons();

    const converted = [];
    const failed = [];

    for (let i = 0; i < state.selectedFiles.length; i += 1) {
      const file = state.selectedFiles[i];
      showStatus("Converting " + (i + 1) + " of " + state.selectedFiles.length + ": " + file.name, "info");

      try {
        const pngBlob = await convertJpgToPng(file);
        converted.push({
          key: fileKey(file),
          name: getOutputName(file.name),
          blob: pngBlob
        });
      } catch (error) {
        failed.push(file.name);
      }
    }

    state.convertedFiles = converted;
    state.isConverting = false;
    renderPreviews();
    updateButtons();

    if (converted.length === 0) {
      showStatus("Conversion failed. Please try another JPG file.", "error");
      return;
    }

    if (failed.length > 0) {
      showStatus(
        "Converted " + converted.length + " file(s). " + failed.length + " file(s) failed during conversion.",
        "info"
      );
    } else {
      showStatus("Converted " + converted.length + " file(s) successfully. Download started.", "success");
    }

    triggerDownloads(converted);
  }

  function downloadAll() {
    if (state.convertedFiles.length === 0) {
      showStatus("No PNG available. Convert at least one JPG image first.", "error");
      return;
    }

    triggerDownloads(state.convertedFiles);
    showStatus("Download started for " + state.convertedFiles.length + " PNG file(s).", "success");
  }

  function clearAll() {
    state.selectedFiles = [];
    state.convertedFiles = [];
    state.isConverting = false;
    state.dragDepth = 0;
    fileInput.value = "";
    setDropHighlight(false);
    renderPreviews();
    updateButtons();
    showStatus("Files cleared.", "info");
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
    setDropHighlight(true);
  });

  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setDropHighlight(true);
  });

  dropZone.addEventListener("dragleave", function (event) {
    event.preventDefault();
    state.dragDepth = Math.max(0, state.dragDepth - 1);
    if (state.dragDepth === 0) {
      setDropHighlight(false);
    }
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();
    state.dragDepth = 0;
    setDropHighlight(false);
    if (event.dataTransfer && event.dataTransfer.files) {
      mergeFiles(event.dataTransfer.files);
    }
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (eventName) {
    document.body.addEventListener(eventName, function (event) {
      event.preventDefault();
    });
  });

  convertBtn.addEventListener("click", function () {
    convertAll();
  });

  downloadBtn.addEventListener("click", function () {
    downloadAll();
  });

  clearBtn.addEventListener("click", function () {
    clearAll();
  });

  previewGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-download-key]");
    if (!button) {
      return;
    }

    const key = decodeURIComponent(button.getAttribute("data-download-key") || "");
    const item = findConvertedByKey(key);
    if (!item) {
      showStatus("This file is not converted yet.", "error");
      return;
    }

    triggerDownloads([item]);
    showStatus("Download started for " + item.name + ".", "success");
  });

  renderPreviews();
  updateButtons();
  showStatus("Drop JPG/JPEG files or click the upload box to begin.", "info");
})();
