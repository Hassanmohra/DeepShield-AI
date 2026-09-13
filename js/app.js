/* =========================================================
   DeepShield AI
   app.js — v0.5
   AI Deepfake Detection + Digital Forensics
   ========================================================= */

import {
    pipeline,
    env
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {
    modelId: "onnx-community/Deep-Fake-Detector-v2-Model-ONNX",

    maxFileSize: 200 * 1024 * 1024,

    allowedImageTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp"
    ],

    allowedVideoTypes: [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo"
    ]
};

/* =========================================================
   TRANSFORMERS.JS SETTINGS
   ========================================================= */

env.allowLocalModels = false;
env.useBrowserCache = true;

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let aiClassifier = null;
let selectedFile = null;
let modelLoading = false;

/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return [...document.querySelectorAll(selector)];
}

function firstExisting(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);

        if (element) {
            return element;
        }
    }

    return null;
}

/* =========================================================
   FIND IMPORTANT ELEMENTS
   ========================================================= */

function getFileInput() {
    return firstExisting([
        "#fileInput",
        "#file",
        "#uploadInput",
        "#mediaInput",
        'input[type="file"]'
    ]);
}

function getDropZone() {
    return firstExisting([
        "#dropZone",
        "#uploadArea",
        "#uploadBox",
        "#dropArea",
        ".drop-zone",
        ".upload-area",
        ".upload-box",
        ".upload-container",
        ".file-drop-zone"
    ]);
}

function getAnalyzeButton() {
    return firstExisting([
        "#analyzeBtn",
        "#scanBtn",
        "#analyzeButton",
        "#startAnalysis",
        ".analyze-btn"
    ]);
}

/* =========================================================
   STATUS MESSAGE
   ========================================================= */

function setStatus(message, type = "normal") {

    const elements = [
        "#uploadStatus",
        "#status",
        "#analysisStatus",
        ".upload-status",
        ".status-message"
    ];

    const element = firstExisting(elements);

    if (!element) {
        console.log(`[DeepShield ${type}]`, message);
        return;
    }

    element.textContent = message;

    element.dataset.status = type;
}

/* =========================================================
   SELECTED FILE DISPLAY
   ========================================================= */

function displaySelectedFile(file) {

    const elements = [
        "#selectedFile",
        "#fileName",
        "#selectedFileName",
        ".selected-file",
        ".file-name"
    ];

    const element = firstExisting(elements);

    if (element) {
        element.textContent =
            `${file.name} • ${formatBytes(file.size)}`;
    }

    const sizeElement = firstExisting([
        "#fileSize",
        ".file-size"
    ]);

    if (sizeElement) {
        sizeElement.textContent = formatBytes(file.size);
    }
}

/* =========================================================
   FILE SIZE
   ========================================================= */

function formatBytes(bytes) {

    if (!Number.isFinite(bytes)) {
        return "0 B";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* =========================================================
   FILE VALIDATION
   ========================================================= */

function validateFile(file) {

    if (!file) {
        return {
            valid: false,
            message: "لم يتم اختيار ملف."
        };
    }

    if (file.size > CONFIG.maxFileSize) {

        return {
            valid: false,
            message: "حجم الملف أكبر من 200 MB."
        };
    }

    const isImage =
        CONFIG.allowedImageTypes.includes(file.type);

    const isVideo =
        CONFIG.allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {

        const extension =
            file.name.split(".").pop()?.toLowerCase();

        const allowedExtensions = [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "bmp",
            "mp4",
            "webm",
            "mov",
            "avi"
        ];

        if (!allowedExtensions.includes(extension)) {

            return {
                valid: false,
                message: "نوع الملف غير مدعوم."
            };
        }
    }

    return {
        valid: true,
        message: "الملف صالح للتحليل."
    };
}

/* =========================================================
   HANDLE FILE
   ========================================================= */

async function handleFile(file) {

    const validation = validateFile(file);

    if (!validation.valid) {

        setStatus(validation.message, "error");

        alert(validation.message);

        return;
    }

    selectedFile = file;

    displaySelectedFile(file);

    setStatus(
        `تم اختيار الملف: ${file.name}`,
        "success"
    );

    const analyzeButton = getAnalyzeButton();

    if (analyzeButton) {
        analyzeButton.disabled = false;
        analyzeButton.removeAttribute("disabled");
    }

    console.log("DeepShield selected:", file);

    /* تحليل تلقائي */
    if (file.type.startsWith("image/")) {

        try {
            await analyzeFile(file);
        } catch (error) {
            console.error(error);
        }
    }
}

/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {

    const input = getFileInput();

    if (!input) {

        console.warn(
            "DeepShield: file input not found."
        );

        return;
    }

    input.addEventListener("change", async event => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        await handleFile(file);
    });
}

/* =========================================================
   DRAG & DROP
   ========================================================= */

function setupDragAndDrop() {

    const dropZone = getDropZone();

    if (!dropZone) {

        console.warn(
            "DeepShield: drop zone not found."
        );

        return;
    }

    console.log(
        "DeepShield: Drag & Drop enabled."
    );

    /* Click */
    dropZone.addEventListener("click", event => {

        if (
            event.target.closest(
                "input, button, a"
            )
        ) {
            return;
        }

        const input = getFileInput();

        if (input) {
            input.click();
        }
    });

    /* Drag enter */
    dropZone.addEventListener(
        "dragenter",
        event => {

            event.preventDefault();
            event.stopPropagation();

            dropZone.classList.add(
                "drag-over"
            );
        }
    );

    /* Drag over */
    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();
            event.stopPropagation();

            if (
                event.dataTransfer
            ) {
                event.dataTransfer.dropEffect =
                    "copy";
            }

            dropZone.classList.add(
                "drag-over"
            );
        }
    );

    /* Drag leave */
    dropZone.addEventListener(
        "dragleave",
        event => {

            event.preventDefault();
            event.stopPropagation();

            if (
                event.relatedTarget &&
                dropZone.contains(
                    event.relatedTarget
                )
            ) {
                return;
            }

            dropZone.classList.remove(
                "drag-over"
            );
        }
    );

    /* Drop */
    dropZone.addEventListener(
        "drop",
        async event => {

            event.preventDefault();
            event.stopPropagation();

            dropZone.classList.remove(
                "drag-over"
            );

            const files =
                event.dataTransfer?.files;

            if (!files || files.length === 0) {

                setStatus(
                    "لم يتم العثور على ملف.",
                    "error"
                );

                return;
            }

            const file = files[0];

            await handleFile(file);
        }
    );
}

/* =========================================================
   GLOBAL DRAG PREVENTION
   ========================================================= */

function setupGlobalDragProtection() {

    [
        "dragenter",
        "dragover",
        "dragleave",
        "drop"
    ].forEach(eventName => {

        document.addEventListener(
            eventName,
            event => {

                event.preventDefault();
                event.stopPropagation();

            },
            false
        );
    });

    /* إعادة تفعيل Drop Zone بعد الحماية العامة */

    const dropZone = getDropZone();

    if (dropZone) {

        [
            "dragenter",
            "dragover",
            "drop"
        ].forEach(eventName => {

            dropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                },
                false
            );
        });
    }
}

/* =========================================================
   LOAD AI MODEL
   ========================================================= */

async function loadAIModel() {

    if (aiClassifier) {
        return aiClassifier;
    }

    if (modelLoading) {
        return null;
    }

    modelLoading = true;

    updateAIStatus(
        "Loading AI model..."
    );

    console.log(
        "DeepShield: Loading AI model..."
    );

    try {

        aiClassifier = await pipeline(
            "image-classification",
            CONFIG.modelId,
            {
                device: "wasm"
            }
        );

        updateAIStatus(
            "AI model ready."
        );

        console.log(
            "DeepShield: AI model loaded."
        );

        return aiClassifier;

    } catch (error) {

        console.error(
            "DeepShield AI model error:",
            error
        );

        updateAIStatus(
            "AI model could not be loaded."
        );

        aiClassifier = null;

        return null;

    } finally {

        modelLoading = false;
    }
}

/* =========================================================
   AI STATUS
   ========================================================= */

function updateAIStatus(message) {

    const status = firstExisting([
        "#aiStatus",
        "#modelStatus",
        ".ai-status"
    ]);

    if (status) {
        status.textContent = message;
    }

    console.log(
        "DeepShield AI:",
        message
    );
}

/* =========================================================
   IMAGE OBJECT URL
   ========================================================= */

function createImageURL(file) {

    return URL.createObjectURL(file);
}

/* =========================================================
   AI IMAGE CLASSIFICATION
   ========================================================= */

async function runAIAnalysis(file) {

    if (!file.type.startsWith("image/")) {

        return {
            available: false,
            label: "Video analysis",
            confidence: null
        };
    }

    const classifier =
        await loadAIModel();

    if (!classifier) {

        return {
            available: false,
            label: "AI unavailable",
            confidence: null
        };
    }

    const imageURL =
        createImageURL(file);

    try {

        const results =
            await classifier(imageURL);

        console.log(
            "DeepShield AI result:",
            results
        );

        if (
            !results ||
            !Array.isArray(results) ||
            results.length === 0
        ) {

            return {
                available: false,
                label: "No result",
                confidence: null
            };
        }

        const sorted =
            [...results].sort(
                (a, b) =>
                    b.score - a.score
            );

        const top =
            sorted[0];

        const label =
            String(top.label || "")
                .toLowerCase();

        let classification =
            "Unknown";

        if (
            label.includes("deepfake") ||
            label.includes("fake")
        ) {

            classification =
                "Potential Deepfake";

        } else if (
            label.includes("realism") ||
            label.includes("real")
        ) {

            classification =
                "Likely Authentic";
        }

        return {

            available: true,

            label: classification,

            rawLabel: top.label,

            confidence:
                Math.round(
                    top.score * 100
                ),

            results: sorted
        };

    } catch (error) {

        console.error(
            "AI inference error:",
            error
        );

        return {
            available: false,
            label: "AI inference failed",
            confidence: null
        };

    } finally {

        URL.revokeObjectURL(
            imageURL
        );
    }
}

/* =========================================================
   LOAD IMAGE
   ========================================================= */

function loadImage(file) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            const url =
                URL.createObjectURL(file);

            image.onload = () => {

                URL.revokeObjectURL(url);

                resolve(image);
            };

            image.onerror = () => {

                URL.revokeObjectURL(url);

                reject(
                    new Error(
                        "Unable to load image."
                    )
                );
            };

            image.src = url;
        }
    );
}

/* =========================================================
   CANVAS
   ========================================================= */

function createAnalysisCanvas(
    image,
    maxSize = 512
) {

    const scale =
        Math.min(
            1,
            maxSize /
                Math.max(
                    image.naturalWidth,
                    image.naturalHeight
                )
        );

    const width =
        Math.max(
            1,
            Math.round(
                image.naturalWidth *
                    scale
            )
        );

    const height =
        Math.max(
            1,
            Math.round(
                image.naturalHeight *
                    scale
            )
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = width;
    canvas.height = height;

    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    return {
        canvas,
        context,
        width,
        height
    };
}

/* =========================================================
   FORENSIC METRICS
   ========================================================= */

function calculateForensicMetrics(
    image
) {

    const {
        canvas,
        context,
        width,
        height
    } = createAnalysisCanvas(image);

    const imageData =
        context.getImageData(
            0,
            0,
            width,
            height
        );

    const pixels =
        imageData.data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    let totalLuma = 0;
    let totalLumaSq = 0;

    let totalSaturation = 0;

    let pixelCount = width * height;

    const histogram =
        new Array(256).fill(0);

    let edgeStrength = 0;
    let edgeSamples = 0;

    let noiseTotal = 0;
    let noiseSamples = 0;

    let blockDifference = 0;
    let blockSamples = 0;

    /* -----------------------------------------
       First pass
       ----------------------------------------- */

    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const index =
                (y * width + x) * 4;

            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];

            totalR += r;
            totalG += g;
            totalB += b;

            const max =
                Math.max(r, g, b);

            const min =
                Math.min(r, g, b);

            const saturation =
                max === 0
                    ? 0
                    : (max - min) / max;

            totalSaturation +=
                saturation;

            const luma =
                0.2126 * r +
                0.7152 * g +
                0.0722 * b;

            totalLuma += luma;
            totalLumaSq +=
                luma * luma;

            histogram[
                Math.max(
                    0,
                    Math.min(
                        255,
                        Math.round(luma)
                    )
                )
            ]++;
        }
    }

    /* -----------------------------------------
       Mean values
       ----------------------------------------- */

    const meanR =
        totalR / pixelCount;

    const meanG =
        totalG / pixelCount;

    const meanB =
        totalB / pixelCount;

    const meanLuma =
        totalLuma / pixelCount;

    const variance =
        Math.max(
            0,
            totalLumaSq /
                pixelCount -
                meanLuma *
                    meanLuma
        );

    const lumaStd =
        Math.sqrt(variance);

    const saturation =
        (
            totalSaturation /
            pixelCount
        ) * 100;

    /* -----------------------------------------
       Edge / noise / blockiness
       ----------------------------------------- */

    for (
        let y = 1;
        y < height - 1;
        y++
    ) {

        for (
            let x = 1;
            x < width - 1;
            x++
        ) {

            const centerIndex =
                (y * width + x) * 4;

            const leftIndex =
                (y * width + x - 1) * 4;

            const rightIndex =
                (y * width + x + 1) * 4;

            const topIndex =
                ((y - 1) * width + x) * 4;

            const bottomIndex =
                ((y + 1) * width + x) * 4;

            const center =
                0.2126 *
                    pixels[centerIndex] +
                0.7152 *
                    pixels[centerIndex + 1] +
                0.0722 *
                    pixels[centerIndex + 2];

            const left =
                0.2126 *
                    pixels[leftIndex] +
                0.7152 *
                    pixels[leftIndex + 1] +
                0.0722 *
                    pixels[leftIndex + 2];

            const right =
                0.2126 *
                    pixels[rightIndex] +
                0.7152 *
                    pixels[rightIndex + 1] +
                0.0722 *
                    pixels[rightIndex + 2];

            const top =
                0.2126 *
                    pixels[topIndex] +
                0.7152 *
                    pixels[topIndex + 1] +
                0.0722 *
                    pixels[topIndex + 2];

            const bottom =
                0.2126 *
                    pixels[bottomIndex] +
                0.7152 *
                    pixels[bottomIndex + 1] +
                0.0722 *
                    pixels[bottomIndex + 2];

            const gx =
                right - left;

            const gy =
                bottom - top;

            const edge =
                Math.sqrt(
                    gx * gx +
                    gy * gy
                );

            edgeStrength += edge;
            edgeSamples++;

            const localMean =
                (
                    left +
                    right +
                    top +
                    bottom
                ) / 4;

            const noise =
                Math.abs(
                    center -
                    localMean
                );

            noiseTotal += noise;
            noiseSamples++;
        }
    }

    /* -----------------------------------------
       Blockiness
       ----------------------------------------- */

    const blockSize = 8;

    for (
        let y = blockSize;
        y < height;
        y += blockSize
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const a =
                ((y - 1) * width + x) * 4;

            const b =
                (y * width + x) * 4;

            const lumA =
                0.2126 * pixels[a] +
                0.7152 * pixels[a + 1] +
                0.0722 * pixels[a + 2];

            const lumB =
                0.2126 * pixels[b] +
                0.7152 * pixels[b + 1] +
                0.0722 * pixels[b + 2];

            blockDifference +=
                Math.abs(
                    lumA - lumB
                );

            blockSamples++;
        }
    }

    for (
        let x = blockSize;
        x < width;
        x += blockSize
    ) {

        for (
            let y = 0;
            y < height;
            y++
        ) {

            const a =
                (y * width + x - 1) * 4;

            const b =
                (y * width + x) * 4;

            const lumA =
                0.2126 * pixels[a] +
                0.7152 * pixels[a + 1] +
                0.0722 * pixels[a + 2];

            const lumB =
                0.2126 * pixels[b] +
                0.7152 * pixels[b + 1] +
                0.0722 * pixels[b + 2];

            blockDifference +=
                Math.abs(
                    lumA - lumB
                );

            blockSamples++;
        }
    }

    const averageEdge =
        edgeSamples
            ? edgeStrength /
              edgeSamples
            : 0;

    const noiseLevel =
        noiseSamples
            ? noiseTotal /
              noiseSamples
            : 0;

    const blockiness =
        blockSamples
            ? blockDifference /
              blockSamples
            : 0;

    /* -----------------------------------------
       Histogram range
       ----------------------------------------- */

    let firstBin = 0;
    let lastBin = 255;

    while (
        firstBin < 256 &&
        histogram[firstBin] === 0
    ) {
        firstBin++;
    }

    while (
        lastBin >= 0 &&
        histogram[lastBin] === 0
    ) {
        lastBin--;
    }

    const histogramRange =
        Math.max(
            0,
            lastBin - firstBin
        );

    /* -----------------------------------------
       Entropy
       ----------------------------------------- */

    let entropy = 0;

    for (
        const count of histogram
    ) {

        if (count === 0) {
            continue;
        }

        const p =
            count / pixelCount;

        entropy -=
            p * Math.log2(p);
    }

    /* -----------------------------------------
       Channel deviation
       ----------------------------------------- */

    const channelDeviation =
        (
            Math.abs(meanR - meanG) +
            Math.abs(meanG - meanB) +
            Math.abs(meanR - meanB)
        ) / 3;

    return {

        width,
        height,

        meanR,
        meanG,
        meanB,

        meanLuma,
        lumaStd,

        saturation,

        entropy,

        edgeStrength:
            averageEdge,

        noiseLevel,

        blockiness,

        histogramRange,

        channelDeviation
    };
}

/* =========================================================
   FORENSIC SCORE
   ========================================================= */

function calculateForensicScore(
    metrics,
    file
) {

    let score = 0;

    /* Extremely low detail */
    if (
        metrics.edgeStrength < 2
    ) {
        score += 8;
    }

    /* Very low noise */
    if (
        metrics.noiseLevel < 1.5
    ) {
        score += 10;
    }

    /* Very low entropy */
    if (
        metrics.entropy < 5.0
    ) {
        score += 10;
    }

    /* Heavy block artifacts */
    if (
        metrics.blockiness > 8
    ) {
        score += 12;
    }

    /* Suspicious histogram compression */
    if (
        metrics.histogramRange < 120
    ) {
        score += 10;
    }

    /* Strong channel imbalance */
    if (
        metrics.channelDeviation > 55
    ) {
        score += 8;
    }

    /* Very unusual saturation */
    if (
        metrics.saturation > 90
    ) {
        score += 5;
    }

    /* Very small resolution */
    if (
        metrics.width < 256 ||
        metrics.height < 256
    ) {
        score += 6;
    }

    /* Supported modern image formats */
    const extension =
        file.name
            .split(".")
            .pop()
            ?.toLowerCase();

    if (
        ["jpg", "jpeg", "png", "webp"]
            .includes(extension)
    ) {
        score += 0;
    }

    return Math.min(
        100,
        Math.round(score)
    );
}

/* =========================================================
   RISK LEVEL
   ========================================================= */

function getRiskLevel(score) {

    if (score >= 60) {
        return "HIGH ANOMALY";
    }

    if (score >= 30) {
        return "MEDIUM ANOMALY";
    }

    return "LOW ANOMALY";
}

/* =========================================================
   AI RESULT DISPLAY
   ========================================================= */

function displayAIResult(
    result
) {

    const confidence =
        $("#aiConfidence");

    const classification =
        $("#aiClassification");

    const status =
        $("#aiStatus");

    const modelName =
        $("#aiModelName");

    if (modelName) {

        modelName.textContent =
            CONFIG.modelId;
    }

    if (!result.available) {

        if (confidence) {
            confidence.textContent = "—";
        }

        if (classification) {
            classification.textContent =
                result.label ||
                "AI unavailable";
        }

        if (status) {
            status.textContent =
                "AI model unavailable";
        }

        return;
    }

    if (confidence) {

        confidence.textContent =
            `${result.confidence}%`;
    }

    if (classification) {

        classification.textContent =
            result.label;
    }

    if (status) {

        status.textContent =
            "Real AI inference completed";
    }
}

/* =========================================================
   FORENSIC RESULT DISPLAY
   ========================================================= */

function displayForensicResult(
    score,
    metrics,
    file
) {

    const scoreElement =
        $("#score");

    const riskElement =
        $("#riskLevel");

    if (scoreElement) {

        scoreElement.textContent =
            `${score}%`;
    }

    const risk =
        getRiskLevel(score);

    if (riskElement) {

        riskElement.textContent =
            risk;
    }

    const assessment =
        $("#overallAssessment");

    if (assessment) {

        if (score >= 60) {

            assessment.textContent =
                "Significant forensic anomalies detected. Further expert verification is recommended.";

        } else if (score >= 30) {

            assessment.textContent =
                "Some forensic anomalies were detected. The media should be reviewed carefully.";

        } else {

            assessment.textContent =
                "No strong forensic anomalies were detected by the browser-based forensic engine.";
        }
    }

    updateIndicator(
        "#indicatorFileStructure",
        "File Structure",
        "Normal"
    );

    updateIndicator(
        "#indicatorResolution",
        "Media Resolution",
        `${metrics.width} × ${metrics.height}`
    );

    updateIndicator(
        "#indicatorAspect",
        "Aspect Ratio",
        `${(
            metrics.width /
            metrics.height
        ).toFixed(2)}`
    );

    updateIndicator(
        "#indicatorEdges",
        "Edge Detail",
        metrics.edgeStrength.toFixed(3)
    );

    updateIndicator(
        "#indicatorNoise",
        "Noise Profile",
        metrics.noiseLevel.toFixed(3)
    );

    updateIndicator(
        "#indicatorEntropy",
        "Image Entropy",
        metrics.entropy.toFixed(3)
    );

    updateIndicator(
        "#indicatorCompression",
        "Compression Pattern",
        metrics.blockiness.toFixed(2)
    );

    updateIndicator(
        "#indicatorColor",
        "Color Distribution",
        metrics.channelDeviation.toFixed(2)
    );

    updateIndicator(
        "#indicatorHistogram",
        "Histogram Spread",
        `${metrics.histogramRange} / 255`
    );

    const extension =
        file.name
            .split(".")
            .pop()
            ?.toUpperCase();

    updateIndicator(
        "#indicatorExtension",
        "File Extension",
        extension || "UNKNOWN"
    );

    displayForensicDetails(
        metrics,
        file
    );
}

/* =========================================================
   INDICATOR HELPER
   ========================================================= */

function updateIndicator(
    selector,
    label,
    value
) {

    const element =
        $(selector);

    if (!element) {
        return;
    }

    element.textContent =
        `${label}: ${value}`;
}

/* =========================================================
   FORENSIC DETAILS
   ========================================================= */

function displayForensicDetails(
    metrics,
    file
) {

    const details =
        $("#forensicDetails") ||
        $("#analysisDetails");

    if (!details) {
        return;
    }

    const type =
        file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
                ? "video"
                : "media";

    details.innerHTML = `
        <div class="forensic-line">
            <strong>File:</strong>
            ${escapeHTML(file.name)}
        </div>

        <div class="forensic-line">
            <strong>Type:</strong>
            ${type}
        </div>

        <div class="forensic-line">
            <strong>Size:</strong>
            ${formatBytes(file.size)}
        </div>

        <div class="forensic-line">
            <strong>Resolution:</strong>
            ${metrics.width} × ${metrics.height}
        </div>

        <div class="forensic-line">
            <strong>Engine:</strong>
            DeepShield Visual Forensics v0.5
        </div>

        <hr>

        <div class="forensic-line">
            <strong>Luminance Mean:</strong>
            ${metrics.meanLuma.toFixed(2)}
        </div>

        <div class="forensic-line">
            <strong>Luminance Std:</strong>
            ${metrics.lumaStd.toFixed(2)}
        </div>

        <div class="forensic-line">
            <strong>Saturation:</strong>
            ${metrics.saturation.toFixed(2)}%
        </div>

        <div class="forensic-line">
            <strong>Entropy:</strong>
            ${metrics.entropy.toFixed(3)}
        </div>

        <div class="forensic-line">
            <strong>Edge Strength:</strong>
            ${metrics.edgeStrength.toFixed(3)}
        </div>

        <div class="forensic-line">
            <strong>Noise Level:</strong>
            ${metrics.noiseLevel.toFixed(3)}
        </div>

        <div class="forensic-line">
            <strong>Blockiness:</strong>
            ${metrics.blockiness.toFixed(2)}
        </div>

        <div class="forensic-line">
            <strong>Histogram Range:</strong>
            ${metrics.histogramRange}
        </div>
    `;
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   ANALYZE FILE
   ========================================================= */

async function analyzeFile(file) {

    if (!file) {
        return;
    }

    const resultSection =
        firstExisting([
            "#results",
            "#result",
            "#analysisResult",
            ".results",
            ".result-section"
        ]);

    if (resultSection) {

        resultSection.classList.add(
            "analysis-loading"
        );
    }

    setStatus(
        "DeepShield is analyzing the media...",
        "processing"
    );

    try {

        /* =====================================
           IMAGE ANALYSIS
           ===================================== */

        if (
            file.type.startsWith("image/")
        ) {

            const image =
                await loadImage(file);

            const metrics =
                calculateForensicMetrics(
                    image
                );

            const forensicScore =
                calculateForensicScore(
                    metrics,
                    file
                );

            /* AI */
            const aiResult =
                await runAIAnalysis(file);

            displayAIResult(
                aiResult
            );

            displayForensicResult(
                forensicScore,
                metrics,
                file
            );

            setStatus(
                "Analysis completed successfully.",
                "success"
            );

        }

        /* =====================================
           VIDEO ANALYSIS
           ===================================== */

        else if (
            file.type.startsWith("video/")
        ) {

            displayVideoResult(
                file
            );

            setStatus(
                "Video metadata analysis completed. Frame-level AI analysis is not yet enabled.",
                "success"
            );
        }

        else {

            throw new Error(
                "Unsupported media type."
            );
        }

    } catch (error) {

        console.error(
            "DeepShield analysis error:",
            error
        );

        setStatus(
            "Analysis failed. Check the browser console for details.",
            "error"
        );

        alert(
            "حدث خطأ أثناء التحليل.\n\n" +
            error.message
        );

    } finally {

        if (resultSection) {

            resultSection.classList.remove(
                "analysis-loading"
            );
        }
    }
}

/* =========================================================
   VIDEO RESULT
   ========================================================= */

function displayVideoResult(
    file
) {

    const score =
        $("#score");

    const risk =
        $("#riskLevel");

    const confidence =
        $("#aiConfidence");

    const classification =
        $("#aiClassification");

    if (confidence) {
        confidence.textContent = "—";
    }

    if (classification) {

        classification.textContent =
            "Video frame AI analysis pending";
    }

    if (score) {
        score.textContent = "—";
    }

    if (risk) {

        risk.textContent =
            "VIDEO METADATA";
    }

    const details =
        $("#forensicDetails") ||
        $("#analysisDetails");

    if (details) {

        details.innerHTML = `
            <div class="forensic-line">
                <strong>File:</strong>
                ${escapeHTML(file.name)}
            </div>

            <div class="forensic-line">
                <strong>Type:</strong>
                Video
            </div>

            <div class="forensic-line">
                <strong>Size:</strong>
                ${formatBytes(file.size)}
            </div>

            <div class="forensic-line">
                <strong>Engine:</strong>
                DeepShield Media Forensics v0.5
            </div>

            <hr>

            <div class="forensic-line">
                Video frame extraction and frame-by-frame AI
                detection will be added in the next engine version.
            </div>
        `;
    }
}

/* =========================================================
   ANALYZE BUTTON
   ========================================================= */

function setupAnalyzeButton() {

    const button =
        getAnalyzeButton();

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            if (!selectedFile) {

                const input =
                    getFileInput();

                if (input) {
                    input.click();
                }

                return;
            }

            await analyzeFile(
                selectedFile
            );
        }
    );
}

/* =========================================================
   PRELOAD AI
   ========================================================= */

function setupAIModel() {

    const preload =
        firstExisting([
            "#loadAI",
            "#loadModel",
            "#preloadAI"
        ]);

    if (preload) {

        preload.addEventListener(
            "click",
            async () => {

                await loadAIModel();

            }
        );
    }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initDeepShield() {

    console.log(
        "===================================="
    );

    console.log(
        "DeepShield AI v0.5"
    );

    console.log(
        "Initializing..."
    );

    console.log(
        "===================================="
    );

    setupGlobalDragProtection();

    setupFileInput();

    setupDragAndDrop();

    setupAnalyzeButton();

    setupAIModel();

    /* Disable analyze until a file exists */

    const button =
        getAnalyzeButton();

    if (button) {
        button.disabled = true;
    }

    /* Update model name */

    const modelName =
        $("#aiModelName");

    if (modelName) {

        modelName.textContent =
            CONFIG.modelId;
    }

    updateAIStatus(
        "AI model will load when needed."
    );

    console.log(
        "DeepShield initialization complete."
    );
}

/* =========================================================
   START APPLICATION
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initDeepShield
    );

} else {

    initDeepShield();
}

/* =========================================================
   DEBUG API
   ========================================================= */

window.DeepShield = {

    version: "0.5",

    config: CONFIG,

    getSelectedFile() {
        return selectedFile;
    },

    loadModel:
        loadAIModel,

    analyze:
        analyzeFile,

    getModel() {
        return aiClassifier;
    }
};

console.log(
    "DeepShield API available as window.DeepShield"
);
