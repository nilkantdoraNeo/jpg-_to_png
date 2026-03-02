"use strict";

window.initResizeTool = function initResizeTool() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");
  const ratioToggle = document.getElementById("ratioToggle");
  const resizeBtn = document.getElementById("resizeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const originalPreview = document.getElementById("originalPreview");
  const resultPreview = document.getElementById("resultPreview");
  const originalEmpty = document.getElementById("originalEmpty");
  const resultEmpty = document.getElementById("resultEmpty");

  if (!dropZone || !fileInput || !widthInput || !heightInput || !ratioToggle || !resizeBtn || !downloadBtn || !clearBtn || !statusMessage || !originalPreview || !resultPreview || !originalEmpty || !resultEmpty) {
    return;
  }

  const state = {
    file: null,
    image: null,
    objectUrl: "",
    result: null,
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
    resizeBtn.disabled = !state.file;
    downloadBtn.disabled = !state.result;
    clearBtn.disabled = !state.file && !state.result;
    [resizeBtn, downloadBtn, clearBtn].forEach(function (btn) {
      btn.classList.toggle("opacity-50", btn.disabled);
      btn.classList.toggle("pointer-events-none", btn.disabled);
    });
  }

  function resetResultPreview() {
    if (state.result && state.result.url) URL.revokeObjectURL(state.result.url);
    state.result = null;
    resultPreview.classList.add("hidden");
    resultEmpty.classList.remove("hidden");
    resultPreview.removeAttribute("src");
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        resolve({ image: img, url: url });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to load image."));
      };
      img.src = url;
    });
  }

  function setSource(file) {
    if (!file || !(file.type || "").startsWith("image/")) {
      showStatus("Please upload a valid image file.", "error");
      return;
    }

    resetResultPreview();

    loadImage(file).then(function (loaded) {
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);

      state.file = file;
      state.image = loaded.image;
      state.objectUrl = loaded.url;

      originalPreview.src = state.objectUrl;
      originalPreview.classList.remove("hidden");
      originalEmpty.classList.add("hidden");

      widthInput.value = loaded.image.naturalWidth;
      heightInput.value = loaded.image.naturalHeight;

      setButtons();
      showStatus("Image loaded. Set dimensions and click Resize.", "success");
    }).catch(function () {
      showStatus("Could not open this image.", "error");
    });
  }

  function parseDimension(input) {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 1) return null;
    return Math.round(value);
  }

  function mimeFor(file) {
    const mime = (file.type || "").toLowerCase();
    if (mime === "image/png" || mime === "image/jpeg" || mime === "image/webp") return mime;
    return "image/png";
  }

  function extFor(mime) {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/webp") return "webp";
    return "png";
  }

  function resizeImage() {
    if (!state.file || !state.image) {
      showStatus("Upload an image first.", "error");
      return;
    }

    const width = parseDimension(widthInput);
    const height = parseDimension(heightInput);
    if (!width || !height) {
      showStatus("Width and height must be valid numbers.", "error");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showStatus("Canvas is not available in this browser.", "error");
      return;
    }

    if (mimeFor(state.file) === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(state.image, 0, 0, width, height);

    const mime = mimeFor(state.file);
    const quality = mime === "image/png" ? undefined : 0.92;

    canvas.toBlob(function (blob) {
      if (!blob) {
        showStatus("Resize failed. Try again.", "error");
        return;
      }

      resetResultPreview();
      const url = URL.createObjectURL(blob);
      state.result = {
        blob: blob,
        url: url,
        name: state.file.name.replace(/\.[^.]+$/, "") + "-" + width + "x" + height + "." + extFor(mime)
      };

      resultPreview.src = url;
      resultPreview.classList.remove("hidden");
      resultEmpty.classList.add("hidden");

      setButtons();
      showStatus("Image resized to " + width + " x " + height + ".", "success");
    }, mime, quality);
  }

  function downloadResult() {
    if (!state.result) {
      showStatus("No resized image available. Resize first.", "error");
      return;
    }

    const a = document.createElement("a");
    a.href = state.result.url;
    a.download = state.result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function clearAll() {
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = "";
    }

    resetResultPreview();
    state.file = null;
    state.image = null;
    fileInput.value = "";

    originalPreview.removeAttribute("src");
    originalPreview.classList.add("hidden");
    originalEmpty.classList.remove("hidden");

    widthInput.value = "";
    heightInput.value = "";

    setButtons();
    showStatus("Cleared.", "info");
  }

  function updateHeightFromWidth() {
    if (!ratioToggle.checked || !state.image) return;
    const width = parseDimension(widthInput);
    if (!width) return;
    const ratio = state.image.naturalHeight / state.image.naturalWidth;
    heightInput.value = Math.max(1, Math.round(width * ratio));
  }

  function updateWidthFromHeight() {
    if (!ratioToggle.checked || !state.image) return;
    const height = parseDimension(heightInput);
    if (!height) return;
    const ratio = state.image.naturalWidth / state.image.naturalHeight;
    widthInput.value = Math.max(1, Math.round(height * ratio));
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
    const file = event.target.files && event.target.files[0];
    if (file) setSource(file);
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
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) setSource(file);
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (eventName) {
    document.body.addEventListener(eventName, function (event) {
      event.preventDefault();
    });
  });

  widthInput.addEventListener("input", updateHeightFromWidth);
  heightInput.addEventListener("input", updateWidthFromHeight);

  resizeBtn.addEventListener("click", resizeImage);
  downloadBtn.addEventListener("click", downloadResult);
  clearBtn.addEventListener("click", clearAll);

  setButtons();
  showStatus("Upload one image to resize.", "info");
};
