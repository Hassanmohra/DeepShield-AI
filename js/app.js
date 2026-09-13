/* =========================================================
   DeepShield AI - app.js
   Version 0.4
   Real AI Deepfake Detection + Digital Forensics
   ========================================================= */

import { pipeline, env } from
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {
    modelId: "onnx-community/Deep-Fake-Detector-v2-Model-ONNX",

    maxFileSizeMB: 200,

    supportedImages: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp"
    ],

    supportedVideos: [
        "video/mp4",
        "video/webm",
        "video/quicktime"
    ]
};

/* =========================================================
   HUGGING FACE / TRANSFORMERS.JS
   ========================================================= */

env.allowLocalModels = false;
env.useBrowserCache = true;

let aiClassifier = null;
let aiModelLoading = false;
let aiModelReady = false;

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

function setText(selector, value) {
    const element = $(selector);

    if (element) {
        element.textContent = value;
    }
}

function setHTML(selector, value) {
    const element = $(selector);

    if (element) {
        element.innerHTML = value;
    }
}

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const fileInput =
    $("#fileInput") ||
    $("#file") ||
    document.querySelector('input[type="file"]');

const dropZone =
    $("#dropZone") ||
    $(".drop-zone") ||
    $("#uploadArea") ||
    $(".upload-area");

const analyzeButton =
    $("#analyzeBtn") ||
    $("#scanBtn") ||
    $("#analyzeButton");

const fileNameElement =
    $("#fileName") ||
    $("#selectedFileName");

const resultSection =
    $("#resultSection") ||
    $("#results") ||
    $("#analysisResult");

const aiConfidence =
    $("#aiConfidence");

const aiStatus =
    $("#aiStatus");

const aiModelName =
    $("#aiModelName");

const aiClassification =
    $("#aiClassification");

const scoreElement =
    $("#score");

const riskElement =
    $("#riskLevel") ||
    $(".risk");

const overallAssessment =
    $("#overallAssessment");

const analysisDetails =
    $("#analysisDetails") ||
    $("#forensicDetails");

/* =========================================================
   STATE
   ========================================================= */

let selectedFile = null;
let selectedImage = null;
let forensicResult = null;
let aiResult = null;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeDeepShield();
});

function initializeDeepShield() {

    setupFileInput();
    setupDropZone();
    setupAnalyzeButton();

    resetUI();

    /*
     * Start loading the real AI model.
     * The model is downloaded only when required.
     */
    preloadAIModel();
}

/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {

    if (!fileInput) {
        console.warn("DeepShield: file input not found.");
        return;
    }

    fileInput.addEventListener("change", (event) => {

        const file =
            event.target.files &&
            event.target.files[0];

        if (file) {
            handleFile(file);
        }
    });
}

/* =========================================================
   DROP ZONE
   ========================================================= */

function setupDropZone() {

    if (!dropZone) {
        return;
    }

    dropZone.addEventListener("click", () => {

        if (fileInput) {
            fileInput.click();
        }

    });

    dropZone.addEventListener("dragover", (event) => {

        event.preventDefault();

        dropZone.classList.add("drag-over");

    });

    dropZone.addEventListener("dragleave", () => {

        dropZone.classList.remove("drag-over");

    });

    dropZone.addEventListener("drop", (event) => {

        event.preventDefault();

        dropZone.classList.remove("drag-over");

        const file =
            event.dataTransfer.files &&
            event.dataTransfer.files[0];

        if (file) {
            handleFile(file);
        }
    });
}

/* =========================================================
   ANALYZE BUTTON
   ========================================================= */

function setupAnalyzeButton() {

    if (!analyzeButton) {
        console.warn("DeepShield: analyze button not found.");
        return;
    }

    analyzeButton.addEventListener("click", async () => {

        if (!selectedFile) {
            showMessage("Please select an image first.");
            return;
        }

        await analyzeSelectedFile();

    });
}

/* =========================================================
   FILE HANDLING
   ========================================================= */

function handleFile(file) {

    clearMessage();

    const validation =
        validateFile(file);

    if (!validation.valid) {

        showMessage(validation.message);

        selectedFile = null;
        selectedImage = null;

        return;
    }

    selectedFile = file;

    updateSelectedFileUI(file);

    /*
     * Images can be analyzed by the AI model.
     * Videos currently use forensic metadata only.
     */

    if (file.type.startsWith("image/")) {

        loadSelectedImage(file);

    } else {

        selectedImage = null;

    }

    if (analyzeButton) {
        analyzeButton.disabled = false;
    }
}

/* =========================================================
   FILE VALIDATION
   ========================================================= */

function validateFile(file) {

    if (!file) {

        return {
            valid: false,
            message: "No file selected."
        };

    }

    const sizeMB =
        file.size / (1024 * 1024);

    if (sizeMB > CONFIG.maxFileSizeMB) {

        return {
            valid: false,
            message:
                `File is too large. Maximum size is ${CONFIG.maxFileSizeMB} MB.`
        };

    }

    const validType =
        CONFIG.supportedImages.includes(file.type) ||
        CONFIG.supportedVideos.includes(file.type);

    if (!validType) {

        return {
            valid: false,
            message:
                "Unsupported file type. Please upload JPG, PNG, WEBP, BMP, MP4 or WEBM."
        };

    }

    return {
        valid: true
    };
}

/* =========================================================
   SELECTED FILE UI
   ========================================================= */

function updateSelectedFileUI(file) {

    if (fileNameElement) {

        fileNameElement.textContent =
            `${file.name} (${formatBytes(file.size)})`;

    }

    /*
     * Optional common elements.
     */

    setText("#selectedFile", file.name);
    setText("#fileSize", formatBytes(file.size));
    setText("#fileType", file.type || "Unknown");
}

/* =========================================================
   IMAGE LOADING
   ========================================================= */

function loadSelectedImage(file) {

    const reader =
        new FileReader();

    reader.onload = () => {

        const image =
            new Image();

        image.onload = () => {

            selectedImage = image;

        };

        image.src =
            reader.result;
    };

    reader.readAsDataURL(file);
}

/* =========================================================
   MAIN ANALYSIS
   ========================================================= */

async function analyzeSelectedFile() {

    if (!selectedFile) {
        return;
    }

    showLoadingState();

    try {

        /*
         * -----------------------------------------
         * 1. DIGITAL FORENSICS
         * -----------------------------------------
         */

        forensicResult =
            await runForensicAnalysis(selectedFile);

        /*
         * -----------------------------------------
         * 2. REAL AI DETECTION
         * -----------------------------------------
         */

        if (selectedFile.type.startsWith("image/")) {

            aiResult =
                await runAIDetection(selectedFile);

        } else {

            aiResult = {
                available: false,
                confidence: null,
                label: "Video AI analysis unavailable",
                model: CONFIG.modelId,
                message:
                    "Video frame analysis is not enabled in this version."
            };

        }

        /*
         * -----------------------------------------
         * 3. DISPLAY RESULTS
         * -----------------------------------------
         */

        displayResults(
            selectedFile,
            forensicResult,
            aiResult
        );

    } catch (error) {

        console.error(
            "DeepShield analysis error:",
            error
        );

        showMessage(
            "Analysis failed. Please try another file."
        );

        hideLoadingState();
    }
}

/* =========================================================
   REAL AI MODEL
   ========================================================= */

async function preloadAIModel() {

    try {

        setAIStatus(
            "Loading AI model..."
        );

        aiModelLoading = true;

        aiClassifier =
            await pipeline(
                "image-classification",
                CONFIG.modelId,
                {
                    device: "wasm"
                }
            );

        aiModelReady = true;
        aiModelLoading = false;

        setAIStatus(
            "AI model ready"
        );

        console.log(
            "DeepShield AI model loaded:",
            CONFIG.modelId
        );

    } catch (error) {

        aiModelLoading = false;
        aiModelReady = false;

        console.error(
            "Failed to load AI model:",
            error
        );

        setAIStatus(
            "AI model could not be loaded"
        );
    }
}

/* =========================================================
   AI DETECTION
   ========================================================= */

async function runAIDetection(file) {

    /*
     * Make sure the model exists.
     */

    if (!aiModelReady) {

        if (!aiModelLoading) {
            await preloadAIModel();
        }

    }

    if (!aiClassifier) {

        return {

            available: false,

            confidence: null,

            label:
                "AI Model Unavailable",

            model:
                CONFIG.modelId,

            message:
                "The real AI model could not be loaded."

        };
    }

    try {

        setAIStatus(
            "Running AI detection..."
        );

        /*
         * Transformers.js accepts the image
         * directly through a Blob URL.
         */

        const imageURL =
            URL.createObjectURL(file);

        const output =
            await aiClassifier(imageURL);

        URL.revokeObjectURL(imageURL);

        console.log(
            "DeepShield AI raw output:",
            output
        );

        if (!output || !output.length) {

            return {

                available: false,

                confidence: null,

                label:
                    "No AI result",

                model:
                    CONFIG.modelId,

                message:
                    "The AI model returned no classification."

            };
        }

        /*
         * Sort by confidence.
         */

        const sorted =
            [...output].sort(
                (a, b) =>
                    Number(b.score) -
                    Number(a.score)
            );

        const top =
            sorted[0];

        const rawLabel =
            String(
                top.label || ""
            ).toLowerCase();

        /*
         * Model labels may appear as:
         *
         * Realism
         * Deepfake
         * LABEL_0
         * LABEL_1
         */

        let normalizedLabel =
            normalizeAIClassification(
                rawLabel
            );

        const confidence =
            Math.round(
                Number(top.score) * 100
            );

        setAIStatus(
            "AI analysis complete"
        );

        return {

            available: true,

            confidence,

            label:
                normalizedLabel,

            rawLabel:
                top.label,

            model:
                CONFIG.modelId,

            allResults:
                sorted,

            message:
                "Classification generated by the trained AI model."

        };

    } catch (error) {

        console.error(
            "AI inference error:",
            error
        );

        setAIStatus(
            "AI inference failed"
        );

        return {

            available: false,

            confidence: null,

            label:
                "AI inference failed",

            model:
                CONFIG.modelId,

            message:
                error.message ||
                "The AI model failed during inference."

        };
    }
}

/* =========================================================
   AI LABEL NORMALIZATION
   ========================================================= */

function normalizeAIClassification(label) {

    const normalized =
        label.toLowerCase().trim();

    /*
     * Explicit Deepfake label.
     */

    if (
        normalized.includes("deepfake") ||
        normalized.includes("fake") ||
        normalized.includes("forged") ||
        normalized === "1" ||
        normalized === "label_1"
    ) {

        return "Deepfake";

    }

    /*
     * Explicit Realism label.
     */

    if (
        normalized.includes("realism") ||
        normalized.includes("real") ||
        normalized === "0" ||
        normalized === "label_0"
    ) {

        return "Realism";

    }

    return label || "Unknown";
}

/* =========================================================
   FORENSIC ANALYSIS
   ========================================================= */

async function runForensicAnalysis(file) {

    const base =
        createBaseForensicResult(file);

    if (!file.type.startsWith("image/")) {

        return {

            ...base,

            score: 0,

            risk: "LOW",

            indicators: [],

            metrics: {},

            videoMode: true

        };
    }

    const image =
        selectedImage ||
        await loadImageFromFile(file);

    if (!image) {

        return {

            ...base,

            score: 0,

            risk: "LOW",

            indicators: [],

            metrics: {}

        };
    }

    /*
     * Limit canvas dimensions for performance.
     */

    const MAX_SIZE = 512;

    const scale =
        Math.min(
            1,
            MAX_SIZE /
            Math.max(
                image.naturalWidth ||
                image.width,

                image.naturalHeight ||
                image.height
            )
        );

    const width =
        Math.max(
            1,
            Math.round(
                (image.naturalWidth ||
                    image.width) * scale
            )
        );

    const height =
        Math.max(
            1,
            Math.round(
                (image.naturalHeight ||
                    image.height) * scale
            )
        );

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx =
        canvas.getContext("2d", {
            willReadFrequently: true
        });

    ctx.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            width,
            height
        );

    const pixels =
        imageData.data;

    const metrics =
        calculateImageMetrics(
            pixels,
            width,
            height
        );

    const indicators =
        calculateForensicIndicators(
            file,
            width,
            height,
            metrics
        );

    const score =
        calculateForensicScore(
            indicators
        );

    const risk =
        getRiskLevel(score);

    return {

        ...base,

        score,

        risk,

        indicators,

        metrics,

        width,

        height

    };
}

/* =========================================================
   BASE FORENSIC DATA
   ========================================================= */

function createBaseForensicResult(file) {

    return {

        fileName:
            file.name,

        type:
            file.type || "unknown",

        size:
            file.size,

        extension:
            getFileExtension(
                file.name
            ),

        originalSize:
            file.size

    };
}

/* =========================================================
   LOAD IMAGE
   ========================================================= */

function loadImageFromFile(file) {

    return new Promise((resolve) => {

        const reader =
            new FileReader();

        reader.onload = () => {

            const image =
                new Image();

            image.onload = () => {
                resolve(image);
            };

            image.onerror = () => {
                resolve(null);
            };

            image.src =
                reader.result;
        };

        reader.onerror = () => {
            resolve(null);
        };

        reader.readAsDataURL(file);

    });
}

/* =========================================================
   PIXEL METRICS
   ========================================================= */

function calculateImageMetrics(
    pixels,
    width,
    height
) {

    let redSum = 0;
    let greenSum = 0;
    let blueSum = 0;

    let luminanceSum = 0;
    let luminanceSquaredSum = 0;

    let saturationSum = 0;

    let edgeSum = 0;
    let edgeCount = 0;

    let noiseSum = 0;
    let noiseCount = 0;

    const histogram =
        new Array(256).fill(0);

    /*
     * First pass.
     */

    for (
        let i = 0;
        i < pixels.length;
        i += 4
    ) {

        const r =
            pixels[i];

        const g =
            pixels[i + 1];

        const b =
            pixels[i + 2];

        redSum += r;
        greenSum += g;
        blueSum += b;

        const luminance =
            0.2126 * r +
            0.7152 * g +
            0.0722 * b;

        luminanceSum +=
            luminance;

        luminanceSquaredSum +=
            luminance *
            luminance;

        const max =
            Math.max(r, g, b);

        const min =
            Math.min(r, g, b);

        const saturation =
            max === 0
                ? 0
                : (max - min) / max;

        saturationSum +=
            saturation;

        histogram[
            Math.round(
                luminance
            )
        ]++;
    }

    const pixelCount =
        pixels.length / 4;

    const redMean =
        redSum / pixelCount;

    const greenMean =
        greenSum / pixelCount;

    const blueMean =
        blueSum / pixelCount;

    const luminanceMean =
        luminanceSum /
        pixelCount;

    const luminanceVariance =
        Math.max(
            0,
            luminanceSquaredSum /
                pixelCount -
                luminanceMean *
                luminanceMean
        );

    const luminanceStd =
        Math.sqrt(
            luminanceVariance
        );

    const saturationMean =
        saturationSum /
        pixelCount;

    /*
     * Edge strength.
     */

    for (
        let y = 1;
        y < height;
        y++
    ) {

        for (
            let x = 1;
            x < width;
            x++
        ) {

            const current =
                getPixelLuminance(
                    pixels,
                    width,
                    x,
                    y
                );

            const left =
                getPixelLuminance(
                    pixels,
                    width,
                    x - 1,
                    y
                );

            const top =
                getPixelLuminance(
                    pixels,
                    width,
                    x,
                    y - 1
                );

            const dx =
                Math.abs(
                    current -
                    left
                );

            const dy =
                Math.abs(
                    current -
                    top
                );

            const edge =
                (dx + dy) / 2;

            edgeSum += edge;

            edgeCount++;

            /*
             * Simple local noise estimate.
             */

            const prediction =
                (
                    left +
                    top
                ) / 2;

            noiseSum +=
                Math.abs(
                    current -
                    prediction
                );

            noiseCount++;
        }
    }

    const edgeStrength =
        edgeCount
            ? edgeSum / edgeCount
            : 0;

    const noiseLevel =
        noiseCount
            ? noiseSum / noiseCount
            : 0;

    /*
     * Histogram range.
     */

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
            lastBin -
            firstBin
        );

    /*
     * Entropy.
     */

    let entropy = 0;

    for (
        const count of histogram
    ) {

        if (count === 0) {
            continue;
        }

        const probability =
            count / pixelCount;

        entropy -=
            probability *
            Math.log2(
                probability
            );
    }

    /*
     * Channel deviation.
     */

    const channelDeviation =
        (
            Math.abs(
                redMean -
                greenMean
            ) +

            Math.abs(
                greenMean -
                blueMean
            ) +

            Math.abs(
                redMean -
                blueMean
            )
        ) / 3;

    /*
     * Blockiness.
     */

    const blockiness =
        calculateBlockiness(
            pixels,
            width,
            height
        );

    return {

        redMean,

        greenMean,

        blueMean,

        luminanceMean,

        luminanceStd,

        saturationMean,

        edgeStrength,

        noiseLevel,

        entropy,

        histogramRange,

        channelDeviation,

        blockiness

    };
}

/* =========================================================
   PIXEL LUMINANCE
   ========================================================= */

function getPixelLuminance(
    pixels,
    width,
    x,
    y
) {

    const index =
        (
            y *
            width +
            x
        ) * 4;

    const r =
        pixels[index];

    const g =
        pixels[index + 1];

    const b =
        pixels[index + 2];

    return (
        0.2126 * r +
        0.7152 * g +
        0.0722 * b
    );
}

/* =========================================================
   BLOCKINESS
   ========================================================= */

function calculateBlockiness(
    pixels,
    width,
    height
) {

    let boundarySum = 0;
    let internalSum = 0;

    let boundaryCount = 0;
    let internalCount = 0;

    for (
        let y = 1;
        y < height;
        y++
    ) {

        for (
            let x = 1;
            x < width;
            x++
        ) {

            const current =
                getPixelLuminance(
                    pixels,
                    width,
                    x,
                    y
                );

            const left =
                getPixelLuminance(
                    pixels,
                    width,
                    x - 1,
                    y
                );

            const difference =
                Math.abs(
                    current -
                    left
                );

            if (
                x % 8 === 0
            ) {

                boundarySum +=
                    difference;

                boundaryCount++;

            } else {

                internalSum +=
                    difference;

                internalCount++;
            }
        }
    }

    const boundaryAverage =
        boundaryCount
            ? boundarySum /
              boundaryCount
            : 0;

    const internalAverage =
        internalCount
            ? internalSum /
              internalCount
            : 0;

    if (
        internalAverage === 0
    ) {
        return 0;
    }

    return (
        boundaryAverage /
        internalAverage
    );
}

/* =========================================================
   FORENSIC INDICATORS
   ========================================================= */

function calculateForensicIndicators(
    file,
    width,
    height,
    metrics
) {

    const aspectRatio =
        width / height;

    const indicators = [];

    /*
     * File structure
     */

    indicators.push({
        name: "File Structure",
        status: "Normal",
        detail:
            "File successfully decoded by the browser."
    });

    /*
     * Resolution
     */

    indicators.push({
        name: "Resolution",
        status:
            width >= 256 &&
            height >= 256
                ? "Valid"
                : "Low",

        detail:
            `${width} × ${height}`
    });

    /*
     * Aspect ratio
     */

    indicators.push({
        name: "Aspect Ratio",

        status:
            aspectRatio >= 0.5 &&
            aspectRatio <= 2
                ? "Normal"
                : "Unusual",

        detail:
            aspectRatio.toFixed(3)
    });

    /*
     * Edge detail
     */

    indicators.push({
        name: "Edge Detail",

        status:
            metrics.edgeStrength >= 12
                ? "Strong"
                : metrics.edgeStrength >= 5
                    ? "Moderate"
                    : "Low",

        detail:
            metrics.edgeStrength.toFixed(3)
    });

    /*
     * Noise
     */

    indicators.push({
        name: "Noise Profile",

        status:
            metrics.noiseLevel >= 8
                ? "High"
                : metrics.noiseLevel >= 3
                    ? "Moderate"
                    : "Low",

        detail:
            metrics.noiseLevel.toFixed(3)
    });

    /*
     * Entropy
     */

    indicators.push({
        name: "Image Entropy",

        status:
            metrics.entropy >= 6
                ? "High Complexity"
                : metrics.entropy >= 4
                    ? "Moderate Complexity"
                    : "Low Complexity",

        detail:
            metrics.entropy.toFixed(3)
    });

    /*
     * Compression
     */

    indicators.push({
        name: "Compression Pattern",

        status:
            metrics.blockiness >= 1.8
                ? "High"
                : metrics.blockiness >= 1.2
                    ? "Moderate"
                    : "Low",

        detail:
            metrics.blockiness.toFixed(2)
    });

    /*
     * Color distribution
     */

    indicators.push({
        name: "Color Distribution",

        status:
            metrics.channelDeviation > 35
                ? "Strong Channel Bias"
                : metrics.channelDeviation > 15
                    ? "Moderate Channel Bias"
                    : "Balanced",

        detail:
            metrics.channelDeviation.toFixed(2)
    });

    /*
     * Histogram
     */

    indicators.push({
        name: "Histogram Spread",

        status:
            metrics.histogramRange >= 180
                ? "Wide"
                : metrics.histogramRange >= 100
                    ? "Moderate"
                    : "Narrow",

        detail:
            `${metrics.histogramRange} / 255`
    });

    /*
     * Extension
     */

    indicators.push({
        name: "File Extension",

        status: "Supported",

        detail:
            file.name
    });

    return indicators;
}

/* =========================================================
   FORENSIC SCORE
   ========================================================= */

function calculateForensicScore(
    indicators
) {

    let score = 0;

    for (
        const indicator of indicators
    ) {

        const status =
            String(
                indicator.status
            ).toLowerCase();

        if (
            status.includes("high") ||
            status.includes("unusual")
        ) {

            score += 2;

        } else if (
            status.includes("moderate")
        ) {

            score += 1;

        }
    }

    /*
     * Keep the score within 0-100.
     */

    return Math.min(
        100,
        Math.round(
            score * 7
        )
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
   DISPLAY RESULTS
   ========================================================= */

function displayResults(
    file,
    forensic,
    ai
) {

    hideLoadingState();

    /*
     * AI Confidence
     */

    if (
        ai &&
        ai.available &&
        typeof ai.confidence === "number"
    ) {

        setText(
            "#aiConfidence",
            `${ai.confidence}%`
        );

        setText(
            "#aiStatus",
            ai.message
        );

        setText(
            "#aiModelName",
            "Deep-Fake-Detector-v2"
        );

        setText(
            "#aiClassification",
            ai.label
        );

    } else {

        setText(
            "#aiConfidence",
            "—"
        );

        setText(
            "#aiStatus",
            ai?.message ||
            "AI model unavailable."
        );

        setText(
            "#aiModelName",
            "Deep-Fake-Detector-v2"
        );

        setText(
            "#aiClassification",
            "Unavailable"
        );
    }

    /*
     * Forensic score
     */

    setText(
        "#score",
        `${forensic.score}%`
    );

    setText(
        "#riskLevel",
        forensic.risk
    );

    /*
     * Overall assessment
     */

    const assessment =
        createOverallAssessment(
            forensic,
            ai
        );

    setText(
        "#overallAssessment",
        assessment
    );

    /*
     * Individual indicators
     */

    updateIndicatorElements(
        forensic.indicators
    );

    /*
     * Detailed report
     */

    renderForensicDetails(
        file,
        forensic,
        ai
    );

    /*
     * Show results
     */

    if (resultSection) {

        resultSection.style.display =
            "block";

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =========================================================
   OVERALL ASSESSMENT
   ========================================================= */

function createOverallAssessment(
    forensic,
    ai
) {

    if (
        ai &&
        ai.available &&
        ai.label === "Deepfake"
    ) {

        return (
            `AI model classified this media as Deepfake ` +
            `with ${ai.confidence}% confidence. ` +
            `Forensic anomaly score: ${forensic.score}%.`
        );
    }

    if (
        ai &&
        ai.available &&
        ai.label === "Realism"
    ) {

        return (
            `AI model classified this media as Realism ` +
            `with ${ai.confidence}% confidence. ` +
            `Forensic anomaly score: ${forensic.score}%.`
        );
    }

    return (
        `AI classification is unavailable. ` +
        `Current forensic anomaly score: ${forensic.score}%. ` +
        `This score is heuristic and is not a definitive deepfake verdict.`
    );
}

/* =========================================================
   UPDATE INDICATORS
   ========================================================= */

function updateIndicatorElements(
    indicators
) {

    const mapping = {

        "File Structure":
            "#indicatorFileStructure",

        "Resolution":
            "#indicatorResolution",

        "Aspect Ratio":
            "#indicatorAspect",

        "Edge Detail":
            "#indicatorEdges",

        "Noise Profile":
            "#indicatorNoise",

        "Image Entropy":
            "#indicatorEntropy",

        "Compression Pattern":
            "#indicatorCompression",

        "Color Distribution":
            "#indicatorColor",

        "Histogram Spread":
            "#indicatorHistogram",

        "File Extension":
            "#indicatorExtension"
    };

    for (
        const indicator of indicators
    ) {

        const selector =
            mapping[
                indicator.name
            ];

        if (!selector) {
            continue;
        }

        const element =
            $(selector);

        if (!element) {
            continue;
        }

        element.textContent =
            `${indicator.status}`;
    }
}

/* =========================================================
   FORENSIC DETAILS
   ========================================================= */

function renderForensicDetails(
    file,
    forensic,
    ai
) {

    if (!analysisDetails) {
        return;
    }

    const metrics =
        forensic.metrics || {};

    const aiText =
        ai &&
        ai.available
            ? `${ai.label} (${ai.confidence}%)`
            : "Unavailable";

    analysisDetails.innerHTML = `
        <div class="forensic-report">

            <p>
                <strong>File:</strong>
                ${escapeHTML(file.name)}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHTML(file.type || "Unknown")}
            </p>

            <p>
                <strong>Size:</strong>
                ${formatBytes(file.size)}
            </p>

            ${
                forensic.width
                    ? `
                        <p>
                            <strong>Resolution:</strong>
                            ${forensic.width} × ${forensic.height}
                        </p>
                    `
                    : ""
            }

            <p>
                <strong>AI Classification:</strong>
                ${escapeHTML(aiText)}
            </p>

            <p>
                <strong>AI Model:</strong>
                Deep-Fake-Detector-v2
            </p>

            ${
                typeof metrics.luminanceMean === "number"
                    ? `
                        <hr>

                        <p>
                            <strong>Luminance Mean:</strong>
                            ${metrics.luminanceMean.toFixed(2)}
                        </p>

                        <p>
                            <strong>Luminance Std:</strong>
                            ${metrics.luminanceStd.toFixed(2)}
                        </p>

                        <p>
                            <strong>Saturation:</strong>
                            ${(metrics.saturationMean * 100).toFixed(2)}%
                        </p>

                        <p>
                            <strong>Entropy:</strong>
                            ${metrics.entropy.toFixed(3)}
                        </p>

                        <p>
                            <strong>Edge Strength:</strong>
                            ${metrics.edgeStrength.toFixed(3)}
                        </p>

                        <p>
                            <strong>Noise Level:</strong>
                            ${metrics.noiseLevel.toFixed(3)}
                        </p>

                        <p>
                            <strong>Blockiness:</strong>
                            ${metrics.blockiness.toFixed(2)}
                        </p>

                        <p>
                            <strong>Histogram Range:</strong>
                            ${metrics.histogramRange}
                        </p>
                    `
                    : ""
            }

        </div>

        <p class="forensic-disclaimer">
            ⚠ AI prediction is generated by a trained
            deepfake classification model. Forensic
            indicators are heuristic signals and should
            not be treated as definitive proof.
        </p>
    `;
}

/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoadingState() {

    if (analyzeButton) {

        analyzeButton.disabled =
            true;

        analyzeButton.dataset.originalText =
            analyzeButton.textContent;

        analyzeButton.textContent =
            "Analyzing...";
    }

    setAIStatus(
        aiModelReady
            ? "Running AI detection..."
            : "Preparing AI model..."
    );
}

function hideLoadingState() {

    if (analyzeButton) {

        analyzeButton.disabled =
            false;

        analyzeButton.textContent =
            analyzeButton.dataset.originalText ||
            "Analyze";
    }
}

/* =========================================================
   AI STATUS
   ========================================================= */

function setAIStatus(message) {

    setText(
        "#aiStatus",
        message
    );
}

/* =========================================================
   UI RESET
   ========================================================= */

function resetUI() {

    if (analyzeButton) {
        analyzeButton.disabled = true;
    }

    setText(
        "#aiConfidence",
        "—"
    );

    setText(
        "#aiStatus",
        "Preparing AI model..."
    );

    setText(
        "#aiModelName",
        "Deep-Fake-Detector-v2"
    );

    setText(
        "#aiClassification",
        "Waiting for analysis"
    );

    setText(
        "#score",
        "—"
    );

    setText(
        "#riskLevel",
        "WAITING"
    );

    setText(
        "#overallAssessment",
        "Upload an image to begin analysis."
    );

    if (resultSection) {
        resultSection.style.display = "none";
    }
}

/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(message) {

    console.warn(
        "DeepShield:",
        message
    );

    const messageElement =
        $("#message") ||
        $("#statusMessage") ||
        $("#uploadMessage");

    if (messageElement) {

        messageElement.textContent =
            message;

        messageElement.style.display =
            "block";
    }
}

function clearMessage() {

    const messageElement =
        $("#message") ||
        $("#statusMessage") ||
        $("#uploadMessage");

    if (messageElement) {

        messageElement.textContent =
            "";

        messageElement.style.display =
            "none";
    }
}

/* =========================================================
   FORMATTING
   ========================================================= */

function formatBytes(bytes) {

    if (!Number.isFinite(bytes)) {
        return "Unknown";
    }

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );
}

function getFileExtension(
    filename
) {

    if (!filename.includes(".")) {
        return "";
    }

    return filename
        .split(".")
        .pop()
        .toLowerCase();
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

/* =========================================================
   GLOBAL DEBUG API
   ========================================================= */

window.DeepShield = {

    getAIStatus: () => ({
        model:
            CONFIG.modelId,

        loading:
            aiModelLoading,

        ready:
            aiModelReady
    }),

    getSelectedFile: () =>
        selectedFile,

    getForensicResult: () =>
        forensicResult,

    getAIResult: () =>
        aiResult
};

console.log(
    "DeepShield AI v0.4 initialized."
);
