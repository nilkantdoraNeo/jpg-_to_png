"use strict";

window.initCropTool = function initCropTool() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const cropStage = document.getElementById("cropStage");
  const cropImage = document.getElementById("cropImage");
  const cropSelection = document.getElementById("cropSelection");
  const cropEmpty = document.getElementById("cropEmpty");
  const cropBtn = document.getElementById("cropBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const resultPreview = document.getElementById("resultPreview");
  const resultEmpty = document.getElementById("resultEmpty");

  if (!dropZone || !fileInput || !cropStage || !cropImage || !cropSelection || !cropEmpty || !cropBtn || !downloadBtn || !clearBtn || !statusMessage || !resultPreview || !resultEmpty) {
    return;
  }

  const state = {
    file: null,
    sourceUrl: "",
    output: null,
    dragDepth: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    cropRect: null
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
    cropBtn.disabled = !state.file;
    downloadBtn.disabled = !state.output;
    clearBtn.disabled = !state.file && !state.output;

    [cropBtn, downloadBtn, clearBtn].forEach(function (btn) {
      btn.classList.toggle("opacity-50", btn.disabled);
      btn.classList.toggle("pointer-events-none", btn.disabled);
    });
  }

  function revokeOutput() {
    if (state.output && state.output.url) URL.revokeObjectURL(state.output.url);
    state.output = null;
    resultPreview.classList.add("hidden");
    resultEmpty.classList.remove("hidden");
    resultPreview.removeAttribute("src");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function resetSelection() {
    state.cropRect = null;
    cropSelection.style.display = "none";
    cropSelection.style.left = "0px";
    cropSelection.style.top = "0px";
    cropSelection.style.width = "0px";
    cropSelection.style.height = "0px";
  }

  function setImageFile(file) {
    if (!file || !(file.type || "").startsWith("image/")) {
      showStatus("Please upload a valid image file.", "error");
      return;
    }

    if (state.sourceUrl) {
      URL.revokeObjectURL(state.sourceUrl);
      state.sourceUrl = "";
    }

    revokeOutput();
    resetSelection();

    state.file = file;
    state.sourceUrl = URL.createObjectURL(file);
    cropImage.src = state.sourceUrl;
    cropStage.classList.remove("hidden");
    cropEmpty.classList.add("hidden");

    setButtons();
    showStatus("Image loaded. Draw a crop area and click Crop Image.", "success");
  }

  function pointerPosition(event) {
    const rect = cropStage.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    return { x: x, y: y };
  }

  function startSelection(event) {
    if (!state.file) return;
    event.preventDefault();

    const point = pointerPosition(event);
    state.dragging = true;
    state.startX = point.x;
    state.startY = point.y;

    cropSelection.style.display = "block";
    cropSelection.style.left = point.x + "px";
    cropSelection.style.top = point.y + "px";
    cropSelection.style.width = "0px";
    cropSelection.style.height = "0px";

    cropStage.setPointerCapture(event.pointerId);
  }

  function moveSelection(event) {
    if (!state.dragging) return;
    event.preventDefault();

    const point = pointerPosition(event);
    const left = Math.min(state.startX, point.x);
    const top = Math.min(state.startY, point.y);
    const width = Math.abs(point.x - state.startX);
    const height = Math.abs(point.y - state.startY);

    cropSelection.style.left = left + "px";
    cropSelection.style.top = top + "px";
    cropSelection.style.width = width + "px";
    cropSelection.style.height = height + "px";

    state.cropRect = { x: left, y: top, width: width, height: height };
  }

  function endSelection(event) {
    if (!state.dragging) return;
    state.dragging = false;

    if (state.cropRect && (state.cropRect.width < 5 || state.cropRect.height < 5)) {
      resetSelection();
      showStatus("Crop area is too small. Drag a larger region.", "error");
      return;
    }

    if (state.cropRect) showStatus("Crop area selected. Click Crop Image.", "info");

    try {
      cropStage.releasePointerCapture(event.pointerId);
    } catch (error) {
    }
  }

  function mimeFor(file) {
    const mime = (file.type || "").toLowerCase();
    if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") return mime;
    return "image/png";
  }

  function extFor(mime) {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/webp") return "webp";
    return "png";
  }

  function cropImageFile() {
    if (!state.file) {
      showStatus("Upload an image first.", "error");
      return;
    }

    if (!state.cropRect || !state.cropRect.width || !state.cropRect.height) {
      showStatus("Select a crop area on the image first.", "error");
      return;
    }

    const displayWidth = cropImage.clientWidth;
    const displayHeight = cropImage.clientHeight;
    if (!displayWidth || !displayHeight) {
      showStatus("Could not read image dimensions.", "error");
      return;
    }

    const scaleX = cropImage.naturalWidth / displayWidth;
    const scaleY = cropImage.naturalHeight / displayHeight;

    const sourceX = Math.round(state.cropRect.x * scaleX);
    const sourceY = Math.round(state.cropRect.y * scaleY);
    const sourceW = Math.round(state.cropRect.width * scaleX);
    const sourceH = Math.round(state.cropRect.height * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, sourceW);
    canvas.height = Math.max(1, sourceH);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showStatus("Canvas unavailable.", "error");
      return;
    }

    if (mimeFor(state.file) === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(cropImage, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);

    const mime = mimeFor(state.file);
    const quality = mime === "image/png" ? undefined : 0.92;

    canvas.toBlob(function (blob) {
      if (!blob) {
        showStatus("Cropping failed. Try again.", "error");
        return;
      }

      revokeOutput();
      const url = URL.createObjectURL(blob);
      state.output = {
        blob: blob,
        url: url,
        name: state.file.name.replace(/\.[^.]+$/, "") + "-cropped." + extFor(mime)
      };

      resultPreview.src = url;
      resultPreview.classList.remove("hidden");
      resultEmpty.classList.add("hidden");

      setButtons();
      showStatus("Image cropped successfully.", "success");
    }, mime, quality);
  }

  function downloadResult() {
    if (!state.output) {
      showStatus("No cropped image available. Crop first.", "error");
      return;
    }

    const link = document.createElement("a");
    link.href = state.output.url;
    link.download = state.output.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearAll() {
    if (state.sourceUrl) {
      URL.revokeObjectURL(state.sourceUrl);
      state.sourceUrl = "";
    }

    state.file = null;
    cropImage.removeAttribute("src");
    cropStage.classList.add("hidden");
    cropEmpty.classList.remove("hidden");

    resetSelection();
    revokeOutput();
    fileInput.value = "";

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
    const file = event.target.files && event.target.files[0];
    if (file) setImageFile(file);
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
    if (file) setImageFile(file);
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (eventName) {
    document.body.addEventListener(eventName, function (event) {
      event.preventDefault();
    });
  });

  cropStage.addEventListener("pointerdown", startSelection);
  cropStage.addEventListener("pointermove", moveSelection);
  cropStage.addEventListener("pointerup", endSelection);
  cropStage.addEventListener("pointercancel", endSelection);

  cropBtn.addEventListener("click", cropImageFile);
  downloadBtn.addEventListener("click", downloadResult);
  clearBtn.addEventListener("click", clearAll);

  setButtons();
  showStatus("Upload one image and draw a crop selection.", "info");
};
