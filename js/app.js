/* =========================================================
   DeepShield AI
   app.js — v0.8
   AI Deepfake Detection + Browser Forensics
   ========================================================= */

const CONFIG = {
    MAX_FILE_SIZE: 200 * 1024 * 1024,

    IMAGE_TYPES: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ],

    VIDEO_TYPES: [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo"
    ],

    MODEL_ID: "onnx-community/Deep-Fake-Detector-v2-Model-ONNX"
};


/* =========================================================
   DOM
   ========================================================= */

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const fileSelected = document.getElementById("fileSelected");
const scanButton = document.getElementById("scanButton");

const resultEmpty = document.getElementById("resultEmpty");
const analysisResult = document.getElementById("analysisResult");

const aiConfidence = document.getElementById("aiConfidence");
const scoreElement = document.getElementById("score");
const riskLevel = document.getElementById("riskLevel");

const aiClassification = document.getElementById("aiClassification");
const deepfakeProbability = document.getElementById("deepfakeProbability");
const realismProbability = document.getElementById("realismProbability");

const modelStatus = document.getElementById("modelStatus");

const analysisProgress = document.getElementById("analysisProgress");
const progressLoad = document.getElementById("progressLoad");
const progressAI = document.getElementById("progressAI");
const progressForensics = document.getElementById("progressForensics");
const progressReport = document.getElementById("progressReport");

const forensicDetails = document.getElementById("forensicDetails");


/* =========================================================
   Indicators
   ========================================================= */

const indicators = {
    fileStructure: document.getElementById("indicatorFileStructure"),
    resolution: document.getElementById("indicatorResolution"),
    aspect: document.getElementById("indicatorAspect"),
    edges: document.getElementById("indicatorEdges"),
    noise: document.getElementById("indicatorNoise"),
    entropy: document.getElementById("indicatorEntropy"),
    compression: document.getElementById("indicatorCompression"),
    color: document.getElementById("indicatorColor"),
    histogram: document.getElementById("indicatorHistogram"),
    extension: document.getElementById("indicatorExtension")
};


/* =========================================================
   State
   ========================================================= */

let selectedFile = null;
let aiClassifier = null;
let aiLoading = false;
let aiError = null;


/* =========================================================
   Utility
   ========================================================= */

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}


function setProgressStep(element, state) {
    if (!element) return;

    element.classList.remove(
        "active",
        "completed",
        "done",
        "loading"
    );

    if (state === "active" || state === "loading") {
        element.classList.add("active");
    }

    if (state === "completed" || state === "done") {
        element.classList.add("completed");
    }
}


function showProgress(show = true) {
    if (analysisProgress) {
        analysisProgress.style.display = show ? "block" : "";
    }
}


function resetProgress() {
    setProgressStep(progressLoad, "active");
    setProgressStep(progressAI, "");
    setProgressStep(progressForensics, "");
    setProgressStep(progressReport, "");
}


function updateModelStatus(text, type = "ready") {
    if (!modelStatus) return;

    modelStatus.textContent = text;

    modelStatus.classList.remove(
        "ready",
        "loading",
        "error",
        "offline"
    );

    modelStatus.classList.add(type);
}


/* =========================================================
   File Validation
   ========================================================= */

function isImage(file) {
    if (!file) return false;

    return (
        CONFIG.IMAGE_TYPES.includes(file.type) ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)
    );
}


function isVideo(file) {
    if (!file) return false;

    return (
        CONFIG.VIDEO_TYPES.includes(file.type) ||
        /\.(mp4|webm|mov|avi)$/i.test(file.name)
    );
}


function isSupportedFile(file) {
    return isImage(file) || isVideo(file);
}


function validateFile(file) {
    if (!file) {
        return {
            valid: false,
            message: "No file selected."
        };
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return {
            valid: false,
            message: "File is too large. Maximum size is 200 MB."
        };
    }

    if (!isSupportedFile(file)) {
        return {
            valid: false,
            message: "Unsupported file type. Please select an image or video."
        };
    }

    return {
        valid: true,
        message: "File is valid."
    };
}


/* =========================================================
   File Selection
   ========================================================= */

function handleFile(file) {
    const validation = validateFile(file);

    if (!validation.valid) {
        selectedFile = null;

        if (fileSelected) {
            fileSelected.textContent = validation.message;
            fileSelected.classList.add("error");
        }

        if (scanButton) {
            scanButton.disabled = true;
        }

        return;
    }

    selectedFile = file;

    if (fileSelected) {
        fileSelected.classList.remove("error");

        fileSelected.innerHTML = `
            <strong>${escapeHTML(file.name)}</strong>
            <span>
                ${formatBytes(file.size)}
            </span>
        `;
    }

    if (scanButton) {
        scanButton.disabled = false;
    }

    if (analysisResult) {
        analysisResult.style.display = "none";
    }

    if (resultEmpty) {
        resultEmpty.style.display = "";
    }
}


function formatBytes(bytes) {
    if (!bytes) return "0 Bytes";

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return (
        (bytes / Math.pow(1024, index)).toFixed(2) +
        " " +
        units[index]
    );
}


function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   File Input
   ========================================================= */

function setupFileInput() {
    if (!fileInput) return;

    fileInput.addEventListener("change", event => {
        const file = event.target.files?.[0];

        if (file) {
            handleFile(file);
        }
    });
}


/* =========================================================
   Drag & Drop
   ========================================================= */

function setupDragAndDrop() {
    if (!dropZone) return;

    dropZone.addEventListener("dragenter", event => {
        event.preventDefault();
        event.stopPropagation();

        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragover", event => {
        event.preventDefault();
        event.stopPropagation();

        dropZone.classList.add("drag-over");

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }
    });

    dropZone.addEventListener("dragleave", event => {
        event.preventDefault();
        event.stopPropagation();

        if (!dropZone.contains(event.relatedTarget)) {
            dropZone.classList.remove("drag-over");
        }
    });

    dropZone.addEventListener("drop", event => {
        event.preventDefault();
        event.stopPropagation();

        dropZone.classList.remove("drag-over");

        const file = event.dataTransfer?.files?.[0];

        if (file) {
            handleFile(file);
        }
    });
}


/* =========================================================
   AI Model Loading
   ========================================================= */

async function loadAIModel() {
    if (aiClassifier || aiLoading) {
        return;
    }

    aiLoading = true;
    aiError = null;

    updateModelStatus(
        "Loading AI model...",
        "loading"
    );

    setText(
        aiConfidence,
        "Loading..."
    );

    try {
        const transformers =
            await import(
                "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1"
            );

        const { pipeline, env } = transformers;

        env.allowLocalModels = false;
        env.useBrowserCache = true;

        aiClassifier = await pipeline(
            "image-classification",
            CONFIG.MODEL_ID,
            {
                device: "wasm"
            }
        );

        updateModelStatus(
            "AI Model Ready",
            "ready"
        );

        setText(
            aiConfidence,
            "Ready"
        );

        console.log(
            "DeepShield AI model loaded successfully:",
            CONFIG.MODEL_ID
        );

    } catch (error) {

        console.error(
            "DeepShield AI model loading failed:",
            error
        );

        aiError = error;

        updateModelStatus(
            "AI Model Error",
            "error"
        );

        setText(
            aiConfidence,
            "Unavailable"
        );
    }

    aiLoading = false;
}


/* =========================================================
   AI Analysis
   ========================================================= */

async function runAIAnalysis(file) {
    if (!aiClassifier) {
        await loadAIModel();
    }

    if (!aiClassifier) {
        throw new Error(
            "AI model is not available."
        );
    }

    const imageURL =
        URL.createObjectURL(file);

    try {
        const results =
            await aiClassifier(imageURL);

        return normalizeAIResults(results);

    } finally {
        URL.revokeObjectURL(imageURL);
    }
}


/* =========================================================
   Normalize AI Results
   ========================================================= */

function normalizeAIResults(results) {

    if (!Array.isArray(results)) {
        throw new Error(
            "Invalid AI model response."
        );
    }

    let deepfakeScore = 0;
    let realismScore = 0;

    results.forEach(result => {

        const label =
            String(result.label || "")
                .toLowerCase();

        const score =
            Number(result.score || 0);

        if (
            label.includes("deepfake") ||
            label.includes("fake")
        ) {
            deepfakeScore = score;
        }

        if (
            label.includes("realism") ||
            label.includes("real")
        ) {
            realismScore = score;
        }
    });

    /*
       If the model returns only one label,
       derive the opposite probability.
    */

    if (
        deepfakeScore === 0 &&
        realismScore > 0
    ) {
        deepfakeScore =
            Math.max(0, 1 - realismScore);
    }

    if (
        realismScore === 0 &&
        deepfakeScore > 0
    ) {
        realismScore =
            Math.max(0, 1 - deepfakeScore);
    }

    /*
       Normalize if necessary.
    */

    const total =
        deepfakeScore +
        realismScore;

    if (total > 0) {
        deepfakeScore /= total;
        realismScore /= total;
    }

    const isDeepfake =
        deepfakeScore >= realismScore;

    const confidence =
        Math.max(
            deepfakeScore,
            realismScore
        );

    return {
        classification:
            isDeepfake
                ? "Deepfake"
                : "Realism",

        confidence:
            confidence * 100,

        deepfakeProbability:
            deepfakeScore * 100,

        realismProbability:
            realismScore * 100,

        rawResults: results
    };
}


/* =========================================================
   Image Forensics
   ========================================================= */

async function runImageForensics(file) {

    if (!isImage(file)) {
        return {
            type: "video",
            score: 0,
            metrics: null
        };
    }

    const image =
        await loadImage(file);

    const MAX_SIZE = 512;

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    const scale =
        Math.min(
            1,
            MAX_SIZE / Math.max(width, height)
        );

    width =
        Math.max(
            1,
            Math.round(width * scale)
        );

    height =
        Math.max(
            1,
            Math.round(height * scale)
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
        calculatePixelMetrics(
            pixels,
            width,
            height
        );

    const score =
        calculateForensicScore(metrics);

    return {
        type: "image",
        width,
        height,
        score,
        metrics
    };
}


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
                        "Unable to read image."
                    )
                );
            };

            image.src = url;
        }
    );
}


/* =========================================================
   Pixel Metrics
   ========================================================= */

function calculatePixelMetrics(
    pixels,
    width,
    height
) {

    let sumLuma = 0;
    let sumLumaSq = 0;

    let saturationSum = 0;
    let saturationSq = 0;

    let channelDeviationSum = 0;

    const histogram =
        new Array(256).fill(0);

    const lumaValues = [];

    let edgeSum = 0;
    let edgeCount = 0;

    let noiseSum = 0;
    let noiseCount = 0;

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

            const luma =
                0.299 * r +
                0.587 * g +
                0.114 * b;

            sumLuma += luma;
            sumLumaSq += luma * luma;

            lumaValues.push(luma);

            histogram[
                Math.max(
                    0,
                    Math.min(
                        255,
                        Math.round(luma)
                    )
                )
            ]++;

            const maxRGB =
                Math.max(r, g, b);

            const minRGB =
                Math.min(r, g, b);

            const saturation =
                maxRGB === 0
                    ? 0
                    : (maxRGB - minRGB) /
                      maxRGB;

            saturationSum += saturation;
            saturationSq +=
                saturation * saturation;

            channelDeviationSum +=
                (
                    Math.abs(r - g) +
                    Math.abs(g - b) +
                    Math.abs(r - b)
                ) / 3;

            /*
               Horizontal edge strength
            */

            if (x > 0) {

                const prevIndex =
                    (y * width + (x - 1)) * 4;

                const prevLuma =
                    0.299 * pixels[prevIndex] +
                    0.587 * pixels[prevIndex + 1] +
                    0.114 * pixels[prevIndex + 2];

                edgeSum +=
                    Math.abs(
                        luma - prevLuma
                    );

                edgeCount++;

                /*
                   Local noise estimate
                */

                if (x > 1) {

                    const prevPrevIndex =
                        (y * width + (x - 2)) * 4;

                    const prevPrevLuma =
                        0.299 * pixels[prevPrevIndex] +
                        0.587 * pixels[prevPrevIndex + 1] +
                        0.114 * pixels[prevPrevIndex + 2];

                    const expected =
                        (
                            prevPrevLuma +
                            luma
                        ) / 2;

                    noiseSum +=
                        Math.abs(
                            prevLuma - expected
                        );

                    noiseCount++;
                }
            }
        }
    }

    const totalPixels =
        width * height;

    const meanLuma =
        sumLuma / totalPixels;

    const varianceLuma =
        Math.max(
            0,
            sumLumaSq / totalPixels -
            meanLuma * meanLuma
        );

    const lumaStd =
        Math.sqrt(varianceLuma);

    const saturationMean =
        saturationSum / totalPixels;

    const saturationVariance =
        Math.max(
            0,
            saturationSq / totalPixels -
            saturationMean * saturationMean
        );

    const saturationStd =
        Math.sqrt(saturationVariance);

    const channelDeviation =
        channelDeviationSum /
        totalPixels;

    const edgeStrength =
        edgeCount > 0
            ? edgeSum / edgeCount
            : 0;

    const noiseLevel =
        noiseCount > 0
            ? noiseSum / noiseCount
            : 0;

    const histogramRange =
        calculateHistogramRange(histogram);

    const entropy =
        calculateEntropy(
            histogram,
            totalPixels
        );

    const blockiness =
        calculateBlockiness(
            lumaValues,
            width,
            height
        );

    return {
        meanLuma,
        lumaStd,

        saturationMean,
        saturationStd,

        channelDeviation,

        edgeStrength,
        noiseLevel,

        histogramRange,
        entropy,

        blockiness
    };
}


/* =========================================================
   Entropy
   ========================================================= */

function calculateEntropy(
    histogram,
    total
) {

    let entropy = 0;

    for (
        let i = 0;
        i < histogram.length;
        i++
    ) {

        if (histogram[i] === 0) {
            continue;
        }

        const probability =
            histogram[i] / total;

        entropy -=
            probability *
            Math.log2(probability);
    }

    return entropy;
}


/* =========================================================
   Histogram Range
   ========================================================= */

function calculateHistogramRange(histogram) {

    let first = -1;
    let last = -1;

    for (
        let i = 0;
        i < histogram.length;
        i++
    ) {

        if (histogram[i] > 0) {
            first = i;
            break;
        }
    }

    for (
        let i = histogram.length - 1;
        i >= 0;
        i--
    ) {

        if (histogram[i] > 0) {
            last = i;
            break;
        }
    }

    if (
        first === -1 ||
        last === -1
    ) {
        return 0;
    }

    return last - first;
}


/* =========================================================
   Blockiness
   ========================================================= */

function calculateBlockiness(
    luma,
    width,
    height
) {

    if (
        width < 16 ||
        height < 16
    ) {
        return 0;
    }

    let boundarySum = 0;
    let boundaryCount = 0;

    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 1;
            x < width;
            x++
        ) {

            if (x % 8 === 0) {

                const current =
                    luma[
                        y * width + x
                    ];

                const previous =
                    luma[
                        y * width + x - 1
                    ];

                boundarySum +=
                    Math.abs(
                        current - previous
                    );

                boundaryCount++;
            }
        }
    }

    return boundaryCount > 0
        ? boundarySum / boundaryCount
        : 0;
}


/* =========================================================
   Forensic Score
   ========================================================= */

function calculateForensicScore(metrics) {

    let score = 0;

    /*
       Low entropy
    */

    if (metrics.entropy < 4.5) {
        score += 18;
    } else if (metrics.entropy < 5.2) {
        score += 10;
    }

    /*
       Low edge detail
    */

    if (metrics.edgeStrength < 2) {
        score += 16;
    } else if (metrics.edgeStrength < 4) {
        score += 8;
    }

    /*
       Noise
    */

    if (
        metrics.noiseLevel < 0.7 ||
        metrics.noiseLevel > 8
    ) {
        score += 12;
    } else if (
        metrics.noiseLevel < 1 ||
        metrics.noiseLevel > 6
    ) {
        score += 6;
    }

    /*
       Blockiness
    */

    if (metrics.blockiness > 8) {
        score += 18;
    } else if (metrics.blockiness > 4) {
        score += 10;
    }

    /*
       Channel deviation
    */

    if (
        metrics.channelDeviation > 70
    ) {
        score += 12;
    } else if (
        metrics.channelDeviation > 50
    ) {
        score += 6;
    }

    /*
       Histogram range
    */

    if (
        metrics.histogramRange < 100
    ) {
        score += 14;
    } else if (
        metrics.histogramRange < 160
    ) {
        score += 7;
    }

    /*
       Very low saturation
    */

    if (
        metrics.saturationMean < 0.08
    ) {
        score += 10;
    }

    return Math.min(
        100,
        Math.round(score)
    );
}


/* =========================================================
   Indicator Helpers
   ========================================================= */

function getEdgeLabel(value) {

    if (value < 2) {
        return "Low";
    }

    if (value < 5) {
        return "Moderate";
    }

    return "High";
}


function getNoiseLabel(value) {

    if (value < 0.7) {
        return "Very Low";
    }

    if (value < 3.5) {
        return "Normal";
    }

    if (value < 6) {
        return "Elevated";
    }

    return "High";
}


function getCompressionLabel(blockiness) {

    if (blockiness < 2) {
        return "Low";
    }

    if (blockiness < 5) {
        return "Moderate";
    }

    return "High";
}


function getColorLabel(channelDeviation) {

    if (channelDeviation < 25) {
        return "Balanced";
    }

    if (channelDeviation < 50) {
        return "Moderate Channel Bias";
    }

    return "Strong Channel Bias";
}


function getEntropyLabel(entropy) {

    if (entropy < 4.5) {
        return "Low Complexity";
    }

    if (entropy < 6) {
        return "Moderate Complexity";
    }

    return "High Complexity";
}


/* =========================================================
   Display Indicators
   ========================================================= */

function displayIndicators(
    file,
    forensic
) {

    if (!forensic || !forensic.metrics) {
        return;
    }

    const m =
        forensic.metrics;

    setText(
        indicators.fileStructure,
        "Normal"
    );

    setText(
        indicators.resolution,
        `${forensic.width} × ${forensic.height}`
    );

    const aspectRatio =
        forensic.height > 0
            ? forensic.width / forensic.height
            : 0;

    setText(
        indicators.aspect,
        aspectRatio.toFixed(2)
    );

    setText(
        indicators.edges,
        getEdgeLabel(
            m.edgeStrength
        )
    );

    setText(
        indicators.noise,
        getNoiseLabel(
            m.noiseLevel
        )
    );

    setText(
        indicators.entropy,
        m.entropy.toFixed(3)
    );

    setText(
        indicators.compression,
        getCompressionLabel(
            m.blockiness
        )
    );

    setText(
        indicators.color,
        getColorLabel(
            m.channelDeviation
        )
    );

    setText(
        indicators.histogram,
        `${Math.round(m.histogramRange)} / 255`
    );

    setText(
        indicators.extension,
        isSupportedFile(file)
            ? "Supported"
            : "Unsupported"
    );
}


/* =========================================================
   AI Display
   ========================================================= */

function displayAIResults(aiResult) {

    if (!aiResult) {
        setText(
            aiConfidence,
            "Unavailable"
        );

        setText(
            aiClassification,
            "Unavailable"
        );

        setText(
            deepfakeProbability,
            "—"
        );

        setText(
            realismProbability,
            "—"
        );

        return;
    }

    const deepfake =
        Math.round(
            aiResult.deepfakeProbability
        );

    const realism =
        Math.round(
            aiResult.realismProbability
        );

    const confidence =
        Math.round(
            aiResult.confidence
        );

    setText(
        aiConfidence,
        `${confidence}%`
    );

    setText(
        aiClassification,
        aiResult.classification
    );

    setText(
        deepfakeProbability,
        `${deepfake}%`
    );

    setText(
        realismProbability,
        `${realism}%`
    );
}


/* =========================================================
   Overall Assessment
   ========================================================= */

function calculateAssessment(aiResult, forensicScore) {

    if (!aiResult) {

        if (forensicScore >= 60) {
            return {
                label: "HIGH — Forensic indicators require review",
                className: "high"
            };
        }

        if (forensicScore >= 30) {
            return {
                label: "MEDIUM — Some forensic anomalies detected",
                className: "medium"
            };
        }

        return {
            label: "LOW — No major forensic anomalies detected",
            className: "low"
        };
    }

    const deepfake =
        aiResult.deepfakeProbability;

    if (deepfake >= 75) {
        return {
            label:
                "HIGH — AI indicates possible deepfake",
            className: "high"
        };
    }

    if (deepfake >= 40) {
        return {
            label:
                "MEDIUM — AI indicates suspicious media",
            className: "medium"
        };
    }

    return {
        label:
            "LOW — AI indicates likely real media",
        className: "low"
    };
}


/* =========================================================
   Forensic Details
   ========================================================= */

function displayForensicDetails(
    file,
    forensic,
    aiResult
) {

    if (!forensicDetails) {
        return;
    }

    let aiSection = "";

    if (aiResult) {

        aiSection = `
            <h4>AI Detection</h4>

            <p>
                <strong>AI Classification:</strong>
                ${escapeHTML(aiResult.classification)}
            </p>

            <p>
                <strong>AI Confidence:</strong>
                ${Math.round(aiResult.confidence)}%
            </p>

            <p>
                <strong>Deepfake Probability:</strong>
                ${Math.round(aiResult.deepfakeProbability)}%
            </p>

            <p>
                <strong>Realism Probability:</strong>
                ${Math.round(aiResult.realismProbability)}%
            </p>
        `;
    } else {

        aiSection = `
            <h4>AI Detection</h4>

            <p>
                <strong>Status:</strong>
                AI model unavailable
            </p>
        `;
    }

    if (
        forensic.type === "video"
    ) {

        forensicDetails.innerHTML = `
            <p>
                <strong>File:</strong>
                ${escapeHTML(file.name)}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHTML(file.type || "video")}
            </p>

            <p>
                <strong>Size:</strong>
                ${formatBytes(file.size)}
            </p>

            ${aiSection}

            <h4>Video Analysis</h4>

            <p>
                Frame-level video analysis is not yet enabled.
            </p>

            <p>
                The current AI model performs image classification.
                Video support will require frame extraction and
                frame-by-frame analysis.
            </p>

            <p>
                ⚠️ AI classification is an analytical signal,
                not definitive proof of manipulation.
            </p>
        `;

        return;
    }

    const m =
        forensic.metrics;

    forensicDetails.innerHTML = `
        <p>
            <strong>File:</strong>
            ${escapeHTML(file.name)}
        </p>

        <p>
            <strong>Type:</strong>
            ${escapeHTML(file.type || "image")}
        </p>

        <p>
            <strong>Size:</strong>
            ${formatBytes(file.size)}
        </p>

        <p>
            <strong>Resolution:</strong>
            ${forensic.width} × ${forensic.height}
        </p>

        ${aiSection}

        <h4>Pixel Forensics</h4>

        <p>
            <strong>Luminance Mean:</strong>
            ${m.meanLuma.toFixed(2)}
        </p>

        <p>
            <strong>Luminance Std:</strong>
            ${m.lumaStd.toFixed(2)}
        </p>

        <p>
            <strong>Saturation:</strong>
            ${(m.saturationMean * 100).toFixed(2)}%
        </p>

        <p>
            <strong>Entropy:</strong>
            ${m.entropy.toFixed(3)}
        </p>

        <p>
            <strong>Edge Strength:</strong>
            ${m.edgeStrength.toFixed(3)}
        </p>

        <p>
            <strong>Noise Level:</strong>
            ${m.noiseLevel.toFixed(3)}
        </p>

        <p>
            <strong>Blockiness:</strong>
            ${m.blockiness.toFixed(2)}
        </p>

        <p>
            <strong>Channel Deviation:</strong>
            ${m.channelDeviation.toFixed(2)}
        </p>

        <p>
            <strong>Histogram Range:</strong>
            ${Math.round(m.histogramRange)}
        </p>

        <p>
            <strong>Forensic Anomaly Score:</strong>
            ${forensic.score}%
        </p>

        <p class="forensic-disclaimer">
            ⚠️ AI classification and forensic indicators
            are analytical signals, not definitive proof
            of manipulation. Results may vary depending
            on image quality, compression, source and
            model generalization.
        </p>
    `;
}


/* =========================================================
   Main Analysis
   ========================================================= */

async function analyzeSelectedFile() {

    if (!selectedFile) {
        return;
    }

    if (scanButton) {
        scanButton.disabled = true;
        scanButton.textContent =
            "⏳ Analyzing...";
    }

    if (resultEmpty) {
        resultEmpty.style.display = "none";
    }

    if (analysisResult) {
        analysisResult.style.display = "block";
    }

    showProgress(true);
    resetProgress();

    /*
       Step 1 — File
    */

    setProgressStep(
        progressLoad,
        "completed"
    );

    /*
       Step 2 — AI
    */

    setProgressStep(
        progressAI,
        "active"
    );

    let aiResult = null;

    if (isImage(selectedFile)) {

        try {

            aiResult =
                await runAIAnalysis(
                    selectedFile
                );

        } catch (error) {

            console.error(
                "AI analysis error:",
                error
            );

            aiResult = null;

            updateModelStatus(
                "AI Analysis Error",
                "error"
            );
        }

    } else {

        updateModelStatus(
            "Image Model — Video Pending",
            "loading"
        );
    }

    setProgressStep(
        progressAI,
        "completed"
    );

    /*
       Step 3 — Forensics
    */

    setProgressStep(
        progressForensics,
        "active"
    );

    let forensicResult;

    try {

        forensicResult =
            await runImageForensics(
                selectedFile
            );

    } catch (error) {

        console.error(
            "Forensic analysis error:",
            error
        );

        forensicResult = {
            type: "unknown",
            score: 0,
            metrics: null
        };
    }

    setProgressStep(
        progressForensics,
        "completed"
    );

    /*
       Step 4 — Report
    */

    setProgressStep(
        progressReport,
        "active"
    );

    displayAIResults(
        aiResult
    );

    displayIndicators(
        selectedFile,
        forensicResult
    );

    const assessment =
        calculateAssessment(
            aiResult,
            forensicResult.score
        );

    setText(
        scoreElement,
        `${forensicResult.score}%`
    );

    setText(
        riskLevel,
        assessment.label
    );

    if (riskLevel) {

        riskLevel.classList.remove(
            "high",
            "medium",
            "low"
        );

        riskLevel.classList.add(
            assessment.className
        );
    }

    displayForensicDetails(
        selectedFile,
        forensicResult,
        aiResult
    );

    setProgressStep(
        progressReport,
        "completed"
    );

    if (scanButton) {

        scanButton.disabled = false;

        scanButton.textContent =
            "🧠 Analyze Again";
    }

    /*
       Keep model status accurate.
    */

    if (aiResult) {

        updateModelStatus(
            "AI Model Ready",
            "ready"
        );
    }

    console.log(
        "DeepShield analysis completed",
        {
            file: selectedFile.name,
            ai: aiResult,
            forensics: forensicResult
        }
    );
}


/* =========================================================
   Scan Button
   ========================================================= */

function setupScanButton() {

    if (!scanButton) {
        return;
    }

    scanButton.addEventListener(
        "click",
        analyzeSelectedFile
    );

    scanButton.disabled = true;
}


/* =========================================================
   Global Drag Protection
   =========================================================

   Important:
   Do NOT prevent all document drops.
   We only protect the browser when the user drops
   outside our actual drop zone.
   ========================================================= */

function setupGlobalDragProtection() {

    document.addEventListener(
        "dragover",
        event => {

            if (
                dropZone &&
                dropZone.contains(
                    event.target
                )
            ) {
                return;
            }

            event.preventDefault();
        }
    );

    document.addEventListener(
        "drop",
        event => {

            if (
                dropZone &&
                dropZone.contains(
                    event.target
                )
            ) {
                return;
            }

            event.preventDefault();
        }
    );
}


/* =========================================================
   Initialization
   ========================================================= */

async function initializeDeepShield() {

    console.log(
        "DeepShield AI initializing..."
    );

    setupFileInput();
    setupDragAndDrop();
    setupScanButton();
    setupGlobalDragProtection();

    updateModelStatus(
        "Loading AI Model...",
        "loading"
    );

    /*
       Load the model in the background.
       The user does not need to wait before
       selecting a file.
    */

    loadAIModel();

    console.log(
        "DeepShield AI initialized."
    );
}


/* =========================================================
   Debug API
   ========================================================= */

window.DeepShield = {

    getSelectedFile: () =>
        selectedFile,

    getModel: () =>
        aiClassifier,

    getModelStatus: () =>
        ({
            loaded: !!aiClassifier,
            loading: aiLoading,
            error: aiError
        }),

    analyze: analyzeSelectedFile,

    reloadModel: async () => {

        aiClassifier = null;
        aiError = null;

        await loadAIModel();
    }
};


/* =========================================================
   Start
   ========================================================= */

initializeDeepShield();
