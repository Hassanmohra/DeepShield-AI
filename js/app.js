/* =========================================================
   DeepShield AI
   app.js v0.7
   Stable Upload + Drag & Drop + Forensics + AI
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
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

    MODEL_ID:
        "onnx-community/Deep-Fake-Detector-v2-Model-ONNX"

};


/* =========================================================
   DOM
   ========================================================= */

const fileInput =
    document.getElementById("fileInput");

const dropZone =
    document.getElementById("dropZone");

const fileSelected =
    document.getElementById("fileSelected");

const scanButton =
    document.getElementById("scanButton");

const resultEmpty =
    document.getElementById("resultEmpty");

const analysisResult =
    document.getElementById("analysisResult");

const aiConfidence =
    document.getElementById("aiConfidence");

const scoreElement =
    document.getElementById("score");

const riskLevel =
    document.getElementById("riskLevel");

const forensicDetails =
    document.getElementById("forensicDetails");


/* =========================================================
   STATE
   ========================================================= */

let selectedFile = null;

let aiClassifier = null;

let aiLoading = false;


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeDeepShield() {

    console.log(
        "DeepShield AI v0.7 initializing..."
    );


    if (!fileInput) {
        console.error(
            "DeepShield ERROR: #fileInput not found."
        );
    }


    if (!dropZone) {
        console.error(
            "DeepShield ERROR: #dropZone not found."
        );
    }


    if (!scanButton) {
        console.error(
            "DeepShield ERROR: #scanButton not found."
        );
    }


    setupFileInput();

    setupDragAndDrop();

    setupScanButton();


    /*
       AI loads independently.
       Even if AI fails, uploading files
       continues to work.
    */

    loadAIModel();


    console.log(
        "DeepShield AI ready."
    );

}


/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {

    if (!fileInput) {
        return;
    }


    fileInput.addEventListener(
        "change",
        function (event) {

            const files =
                event.target.files;


            if (
                !files ||
                files.length === 0
            ) {
                return;
            }


            const file =
                files[0];


            console.log(
                "File selected:",
                file.name
            );


            handleSelectedFile(file);

        }
    );

}


/* =========================================================
   DRAG & DROP
   ========================================================= */

function setupDragAndDrop() {

    if (!dropZone) {
        return;
    }


    /*
       IMPORTANT:
       We DO NOT add a click listener here.

       The HTML uses:

       <label for="fileInput">

       so the browser already opens the
       file picker automatically.
    */


    dropZone.addEventListener(
        "dragenter",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            dropZone.classList.add(
                "drag-over"
            );

        }
    );


    dropZone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            if (event.dataTransfer) {

                event.dataTransfer.dropEffect =
                    "copy";

            }


            dropZone.classList.add(
                "drag-over"
            );

        }
    );


    dropZone.addEventListener(
        "dragleave",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            if (
                !event.relatedTarget ||
                !dropZone.contains(
                    event.relatedTarget
                )
            ) {

                dropZone.classList.remove(
                    "drag-over"
                );

            }

        }
    );


    dropZone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            dropZone.classList.remove(
                "drag-over"
            );


            const files =
                event.dataTransfer &&
                event.dataTransfer.files;


            if (
                !files ||
                files.length === 0
            ) {

                showFileError(
                    "No file was detected."
                );

                return;

            }


            const file =
                files[0];


            console.log(
                "Dropped file:",
                file.name
            );


            /*
               Synchronize the hidden
               input with the dropped file
               when the browser allows it.
            */

            try {

                const dataTransfer =
                    new DataTransfer();

                dataTransfer.items.add(file);

                fileInput.files =
                    dataTransfer.files;

            } catch (error) {

                console.log(
                    "Input synchronization skipped."
                );

            }


            handleSelectedFile(file);

        }
    );

}


/* =========================================================
   FILE HANDLING
   ========================================================= */

function handleSelectedFile(file) {

    console.log(
        "Handling file:",
        file
    );


    const validation =
        validateFile(file);


    if (!validation.valid) {

        selectedFile = null;

        showFileError(
            validation.message
        );

        return;

    }


    selectedFile = file;


    /*
       Display file information
    */

    if (fileSelected) {

        fileSelected.classList.add(
            "file-selected"
        );


        fileSelected.innerHTML = `

            <strong>
                ✅ Selected Media
            </strong>

            <br>

            ${escapeHTML(file.name)}

            <br>

            <small>

                ${formatBytes(file.size)}

                ·

                ${escapeHTML(
                    file.type || "Unknown type"
                )}

            </small>

        `;

    }


    /*
       Enable analysis button
    */

    if (scanButton) {

        scanButton.disabled = false;

        scanButton.textContent =
            "🧠 Start AI Analysis";

    }


    /*
       Reset result area
    */

    if (resultEmpty) {

        resultEmpty.style.display =
            "flex";

    }


    if (analysisResult) {

        analysisResult.style.display =
            "none";

    }


    console.log(
        "File is ready for analysis."
    );

}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateFile(file) {

    if (!file) {

        return {
            valid: false,
            message: "No file selected."
        };

    }


    if (
        file.size >
        CONFIG.MAX_FILE_SIZE
    ) {

        return {
            valid: false,
            message:
                "File is larger than 200 MB."
        };

    }


    const supportedMime =
        CONFIG.IMAGE_TYPES.includes(
            file.type
        ) ||
        CONFIG.VIDEO_TYPES.includes(
            file.type
        );


    const supportedExtension =
        isSupportedExtension(
            file.name
        );


    if (
        !supportedMime &&
        !supportedExtension
    ) {

        return {
            valid: false,
            message:
                "Unsupported file type. Please use JPG, PNG, WEBP, GIF, MP4, WEBM, MOV or AVI."
        };

    }


    return {
        valid: true
    };

}


/* =========================================================
   EXTENSION
   ========================================================= */

function isSupportedExtension(
    filename
) {

    const extension =
        filename
            .split(".")
            .pop()
            .toLowerCase();


    return [

        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",

        "mp4",
        "webm",
        "mov",
        "avi"

    ].includes(extension);

}


/* =========================================================
   SCAN BUTTON
   ========================================================= */

function setupScanButton() {

    if (!scanButton) {
        return;
    }


    /*
       Start disabled until a file is selected.
    */

    scanButton.disabled = true;


    scanButton.addEventListener(
        "click",
        async function () {

            if (!selectedFile) {

                showFileError(
                    "Please select an image or video first."
                );

                return;

            }


            await analyzeFile(
                selectedFile
            );

        }
    );

}


/* =========================================================
   AI MODEL
   ========================================================= */

async function loadAIModel() {

    if (
        aiLoading ||
        aiClassifier
    ) {
        return;
    }


    aiLoading = true;


    console.log(
        "Loading DeepShield AI model..."
    );


    try {

        const transformers =
            await import(
                "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1"
            );


        const pipeline =
            transformers.pipeline;

        const env =
            transformers.env;


        if (!pipeline) {

            throw new Error(
                "Transformers.js pipeline is unavailable."
            );

        }


        if (env) {

            env.allowLocalModels =
                false;

            env.useBrowserCache =
                true;

        }


        console.log(
            "Downloading model:",
            CONFIG.MODEL_ID
        );


        aiClassifier =
            await pipeline(
                "image-classification",
                CONFIG.MODEL_ID,
                {
                    device: "wasm"
                }
            );


        console.log(
            "DeepShield AI model loaded."
        );


        updateAIStatus(
            "AI model ready"
        );

    } catch (error) {

        console.error(
            "AI model loading failed:",
            error
        );


        aiClassifier = null;


        updateAIStatus(
            "AI model unavailable"
        );

    } finally {

        aiLoading = false;

    }

}


/* =========================================================
   ANALYSIS
   ========================================================= */

async function analyzeFile(file) {

    console.log(
        "Starting analysis:",
        file.name
    );


    if (resultEmpty) {

        resultEmpty.style.display =
            "none";

    }


    if (analysisResult) {

        analysisResult.style.display =
            "block";

    }


    if (scanButton) {

        scanButton.disabled = true;

        scanButton.textContent =
            "⏳ Analyzing media...";

    }


    if (aiConfidence) {

        aiConfidence.textContent =
            "Analyzing...";

    }


    try {

        /*
           IMAGE
        */

        if (
            file.type.startsWith(
                "image/"
            ) ||
            isImageExtension(file.name)
        ) {

            const forensic =
                await runImageForensics(
                    file
                );


            let aiResult = null;


            if (aiClassifier) {

                try {

                    aiResult =
                        await runAIAnalysis(
                            file
                        );

                } catch (error) {

                    console.error(
                        "AI inference failed:",
                        error
                    );

                }

            }


            displayResults(
                file,
                forensic,
                aiResult
            );


        }

        /*
           VIDEO
        */

        else if (
            file.type.startsWith(
                "video/"
            ) ||
            isVideoExtension(file.name)
        ) {

            const forensic =
                await analyzeVideo(
                    file
                );


            displayVideoResults(
                file,
                forensic
            );

        }


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        showFileError(
            "Analysis failed. Please try another file."
        );


    } finally {

        if (scanButton) {

            scanButton.disabled = false;

            scanButton.textContent =
                "🧠 Start AI Analysis";

        }

    }

}


/* =========================================================
   AI INFERENCE
   ========================================================= */

async function runAIAnalysis(file) {

    if (!aiClassifier) {
        return null;
    }


    console.log(
        "Running AI inference..."
    );


    const imageURL =
        URL.createObjectURL(file);


    try {

        const results =
            await aiClassifier(
                imageURL
            );


        console.log(
            "AI results:",
            results
        );


        return normalizeAIResults(
            results
        );

    } finally {

        URL.revokeObjectURL(
            imageURL
        );

    }

}


/* =========================================================
   NORMALIZE AI
   ========================================================= */

function normalizeAIResults(
    results
) {

    if (
        !Array.isArray(results) ||
        results.length === 0
    ) {

        return null;

    }


    const sorted =
        [...results].sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );


    let deepfake = null;

    let realism = null;


    for (const result of results) {

        const label =
            String(
                result.label || ""
            ).toLowerCase();


        if (
            label.includes(
                "deepfake"
            ) ||
            label.includes(
                "fake"
            )
        ) {

            deepfake =
                result.score;

        }


        if (
            label.includes(
                "real"
            ) ||
            label.includes(
                "realism"
            )
        ) {

            realism =
                result.score;

        }

    }


    if (
        deepfake === null &&
        realism === null
    ) {

        const top =
            sorted[0];


        return {

            label:
                top.label,

            confidence:
                Math.round(
                    (top.score || 0) *
                    100
                ),

            deepfakeProbability:
                null

        };

    }


    return {

        label:
            deepfake !== null &&
            deepfake >=
            (realism || 0)
                ? "Deepfake"
                : "Realism",


        confidence:
            Math.round(
                Math.max(
                    deepfake || 0,
                    realism || 0
                ) * 100
            ),


        deepfakeProbability:
            Math.round(
                (deepfake || 0) *
                100
            ),


        realismProbability:
            Math.round(
                (realism || 0) *
                100
            )

    };

}


/* =========================================================
   IMAGE FORENSICS
   ========================================================= */

async function runImageForensics(
    file
) {

    const image =
        await loadImage(file);


    const maxSize = 512;


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


    canvas.width =
        width;

    canvas.height =
        height;


    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    if (!ctx) {

        throw new Error(
            "Canvas is unavailable."
        );

    }


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


    let sumLuma = 0;

    let sumLumaSq = 0;

    let sumSat = 0;

    let sumSatSq = 0;

    let edgeSum = 0;


    const histogram =
        new Array(256)
            .fill(0);


    const sampleStep = 4;

    let samples = 0;


    for (
        let y = 0;
        y < height;
        y += sampleStep
    ) {

        for (
            let x = 0;
            x < width;
            x += sampleStep
        ) {

            const index =
                (
                    y * width +
                    x
                ) * 4;


            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];


            const luma =
                0.2126 * r +
                0.7152 * g +
                0.0722 * b;


            sumLuma +=
                luma;

            sumLumaSq +=
                luma * luma;


            const max =
                Math.max(
                    r,
                    g,
                    b
                );


            const min =
                Math.min(
                    r,
                    g,
                    b
                );


            const sat =
                max === 0
                    ? 0
                    : (
                        max - min
                    ) / max;


            sumSat +=
                sat;

            sumSatSq +=
                sat * sat;


            histogram[
                Math.round(luma)
            ]++;


            if (
                x + sampleStep <
                width
            ) {

                const nextIndex =
                    (
                        y * width +
                        x +
                        sampleStep
                    ) * 4;


                const nr =
                    pixels[nextIndex];

                const ng =
                    pixels[
                        nextIndex + 1
                    ];

                const nb =
                    pixels[
                        nextIndex + 2
                    ];


                const nextLuma =
                    0.2126 * nr +
                    0.7152 * ng +
                    0.0722 * nb;


                edgeSum +=
                    Math.abs(
                        luma -
                        nextLuma
                    );

            }


            samples++;

        }

    }


    const lumaMean =
        sumLuma /
        samples;


    const lumaVariance =
        Math.max(
            0,
            sumLumaSq /
            samples -
            lumaMean *
            lumaMean
        );


    const lumaStd =
        Math.sqrt(
            lumaVariance
        );


    const saturationMean =
        sumSat /
        samples *
        100;


    const saturationVariance =
        Math.max(
            0,
            sumSatSq /
            samples -
            Math.pow(
                sumSat /
                samples,
                2
            )
        );


    const saturationStd =
        Math.sqrt(
            saturationVariance
        ) * 100;


    const entropy =
        calculateEntropy(
            histogram,
            samples
        );


    const histogramRange =
        calculateHistogramRange(
            histogram
        );


    const edgeStrength =
        edgeSum /
        samples;


    const noiseLevel =
        calculateNoise(
            pixels,
            width,
            height
        );


    const channelDeviation =
        calculateChannelDeviation(
            pixels,
            sampleStep
        );


    const blockiness =
        calculateBlockiness(
            pixels,
            width,
            height
        );


    const score =
        calculateForensicScore({
            width,
            height,
            entropy,
            edgeStrength,
            noiseLevel,
            blockiness,
            channelDeviation,
            histogramRange,
            saturationMean
        });


    return {

        width,
        height,

        lumaMean,
        lumaStd,

        saturationMean,
        saturationStd,

        entropy,

        edgeStrength,

        noiseLevel,

        blockiness,

        channelDeviation,

        histogramRange,

        score

    };

}


/* =========================================================
   FORENSIC SCORE
   ========================================================= */

function calculateForensicScore(
    data
) {

    let score = 0;


    if (data.entropy < 4) {
        score += 12;
    }


    if (data.edgeStrength < 1.5) {
        score += 10;
    }


    if (
        data.noiseLevel < 0.5 ||
        data.noiseLevel > 8
    ) {

        score += 12;

    }


    if (data.blockiness > 8) {
        score += 15;
    }


    if (
        data.channelDeviation >
        40
    ) {

        score += 12;

    }


    if (
        data.histogramRange <
        100
    ) {

        score += 10;

    }


    if (
        data.saturationMean <
        8
    ) {

        score += 5;

    }


    return Math.min(
        100,
        Math.round(score)
    );

}


/* =========================================================
   ENTROPY
   ========================================================= */

function calculateEntropy(
    histogram,
    total
) {

    let entropy = 0;


    for (
        const count of histogram
    ) {

        if (count === 0) {
            continue;
        }


        const probability =
            count / total;


        entropy -=
            probability *
            Math.log2(
                probability
            );

    }


    return entropy;

}


/* =========================================================
   HISTOGRAM
   ========================================================= */

function calculateHistogramRange(
    histogram
) {

    let first = -1;

    let last = -1;


    for (
        let i = 0;
        i < histogram.length;
        i++
    ) {

        if (
            histogram[i] > 0
        ) {

            first = i;

            break;

        }

    }


    for (
        let i =
            histogram.length - 1;
        i >= 0;
        i--
    ) {

        if (
            histogram[i] > 0
        ) {

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
   NOISE
   ========================================================= */

function calculateNoise(
    pixels,
    width,
    height
) {

    let sum = 0;

    let count = 0;


    for (
        let y = 1;
        y < height - 1;
        y += 4
    ) {

        for (
            let x = 1;
            x < width - 1;
            x += 4
        ) {

            const index =
                (
                    y * width +
                    x
                ) * 4;


            const center =
                pixels[index];


            const left =
                pixels[
                    (
                        y * width +
                        x - 1
                    ) * 4
                ];


            const right =
                pixels[
                    (
                        y * width +
                        x + 1
                    ) * 4
                ];


            const top =
                pixels[
                    (
                        (y - 1) *
                        width +
                        x
                    ) * 4
                ];


            const bottom =
                pixels[
                    (
                        (y + 1) *
                        width +
                        x
                    ) * 4
                ];


            const average =
                (
                    left +
                    right +
                    top +
                    bottom
                ) / 4;


            sum +=
                Math.abs(
                    center -
                    average
                );


            count++;

        }

    }


    return count
        ? sum / count
        : 0;

}


/* =========================================================
   CHANNEL DEVIATION
   ========================================================= */

function calculateChannelDeviation(
    pixels,
    step
) {

    let sumR = 0;

    let sumG = 0;

    let sumB = 0;

    let count = 0;


    for (
        let i = 0;
        i < pixels.length;
        i += 4 * step
    ) {

        sumR +=
            pixels[i];

        sumG +=
            pixels[i + 1];

        sumB +=
            pixels[i + 2];

        count++;

    }


    if (!count) {
        return 0;
    }


    const r =
        sumR / count;

    const g =
        sumG / count;

    const b =
        sumB / count;


    return (
        Math.max(
            r,
            g,
            b
        ) -
        Math.min(
            r,
            g,
            b
        )
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

    let score = 0;

    let count = 0;

    const block = 8;


    for (
        let x = block;
        x < width;
        x += block
    ) {

        for (
            let y = 0;
            y < height;
            y += 8
        ) {

            const a =
                pixels[
                    (
                        y * width +
                        x - 1
                    ) * 4
                ];


            const b =
                pixels[
                    (
                        y * width +
                        x
                    ) * 4
                ];


            score +=
                Math.abs(
                    a - b
                );


            count++;

        }

    }


    return count
        ? score / count
        : 0;

}


/* =========================================================
   DISPLAY RESULTS
   ========================================================= */

function displayResults(
    file,
    forensic,
    aiResult
) {

    if (aiConfidence) {

        if (aiResult) {

            aiConfidence.textContent =
                `${aiResult.confidence}%`;

        } else {

            aiConfidence.textContent =
                "Unavailable";

        }

    }


    if (scoreElement) {

        scoreElement.textContent =
            `${forensic.score}%`;

    }


    if (riskLevel) {

        if (
            aiResult &&
            aiResult.deepfakeProbability != null
        ) {

            const probability =
                aiResult.deepfakeProbability;


            if (probability >= 75) {

                riskLevel.textContent =
                    "HIGH — AI indicates possible deepfake";

            } else if (
                probability >= 40
            ) {

                riskLevel.textContent =
                    "MEDIUM — AI indicates suspicious media";

            } else {

                riskLevel.textContent =
                    "LOW — AI indicates likely real media";

            }

        } else {

            if (forensic.score >= 60) {

                riskLevel.textContent =
                    "HIGH FORENSIC ANOMALY";

            } else if (
                forensic.score >= 30
            ) {

                riskLevel.textContent =
                    "MEDIUM FORENSIC ANOMALY";

            } else {

                riskLevel.textContent =
                    "LOW FORENSIC ANOMALY";

            }

        }

    }


    setIndicator(
        "indicatorFileStructure",
        "Normal"
    );


    setIndicator(
        "indicatorResolution",
        `${forensic.width} × ${forensic.height}`
    );


    setIndicator(
        "indicatorAspect",
        calculateAspect(
            forensic.width,
            forensic.height
        )
    );


    setIndicator(
        "indicatorEdges",
        classifyEdge(
            forensic.edgeStrength
        )
    );


    setIndicator(
        "indicatorNoise",
        classifyNoise(
            forensic.noiseLevel
        )
    );


    setIndicator(
        "indicatorEntropy",
        forensic.entropy.toFixed(3)
    );


    setIndicator(
        "indicatorCompression",
        classifyCompression(
            forensic.blockiness
        )
    );


    setIndicator(
        "indicatorColor",
        classifyColor(
            forensic.channelDeviation
        )
    );


    setIndicator(
        "indicatorHistogram",
        `${forensic.histogramRange} / 255`
    );


    setIndicator(
        "indicatorExtension",
        "Supported"
    );


    if (forensicDetails) {

        let aiText =
            "AI Model: Not available";


        if (aiResult) {

            aiText = `

                AI Classification:
                ${escapeHTML(
                    aiResult.label
                )}

                <br>

                AI Confidence:
                ${aiResult.confidence}%

                <br>

                ${
                    aiResult.deepfakeProbability != null
                        ? `
                            Deepfake Probability:
                            ${aiResult.deepfakeProbability}%
                            <br>
                          `
                        : ""
                }

                ${
                    aiResult.realismProbability != null
                        ? `
                            Realism Probability:
                            ${aiResult.realismProbability}%
                          `
                        : ""
                }

            `;

        }


        forensicDetails.innerHTML = `

            <strong>File</strong>:
            ${escapeHTML(file.name)}

            <br>

            <strong>Type</strong>:
            ${escapeHTML(
                file.type ||
                "Unknown"
            )}

            <br>

            <strong>Size</strong>:
            ${formatBytes(file.size)}

            <br>

            <strong>Resolution</strong>:
            ${forensic.width}
            ×
            ${forensic.height}

            <br><br>

            <strong>AI Detection</strong>

            <br>

            ${aiText}

            <br><br>

            <strong>Pixel Forensics</strong>

            <br>

            Luminance Mean:
            ${forensic.lumaMean.toFixed(2)}

            <br>

            Luminance Std:
            ${forensic.lumaStd.toFixed(2)}

            <br>

            Saturation:
            ${forensic.saturationMean.toFixed(2)}%

            <br>

            Entropy:
            ${forensic.entropy.toFixed(3)}

            <br>

            Edge Strength:
            ${forensic.edgeStrength.toFixed(3)}

            <br>

            Noise Level:
            ${forensic.noiseLevel.toFixed(3)}

            <br>

            Blockiness:
            ${forensic.blockiness.toFixed(2)}

            <br>

            Channel Deviation:
            ${forensic.channelDeviation.toFixed(2)}

            <br>

            Histogram Range:
            ${forensic.histogramRange}

            <br>

            Forensic Anomaly Score:
            ${forensic.score}%

        `;

    }

}


/* =========================================================
   VIDEO
   ========================================================= */

async function analyzeVideo(
    file
) {

    return {

        score: 0,

        note:
            "Video metadata analysis only. " +
            "Frame-level AI detection is not connected yet."

    };

}


function displayVideoResults(
    file,
    forensic
) {

    if (aiConfidence) {

        aiConfidence.textContent =
            "Video";

    }


    if (scoreElement) {

        scoreElement.textContent =
            "—";

    }


    if (riskLevel) {

        riskLevel.textContent =
            "VIDEO FRAME ANALYSIS PENDING";

    }


    if (forensicDetails) {

        forensicDetails.innerHTML = `

            <strong>File</strong>:
            ${escapeHTML(file.name)}

            <br>

            <strong>Type</strong>:
            ${escapeHTML(
                file.type ||
                "Video"
            )}

            <br>

            <strong>Size</strong>:
            ${formatBytes(file.size)}

            <br><br>

            ${escapeHTML(
                forensic.note
            )}

        `;

    }

}


/* =========================================================
   IMAGE / VIDEO HELPERS
   ========================================================= */

function isImageExtension(
    filename
) {

    return [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif"
    ].includes(
        filename
            .split(".")
            .pop()
            .toLowerCase()
    );

}


function isVideoExtension(
    filename
) {

    return [
        "mp4",
        "webm",
        "mov",
        "avi"
    ].includes(
        filename
            .split(".")
            .pop()
            .toLowerCase()
    );

}


/* =========================================================
   UI
   ========================================================= */

function setIndicator(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function calculateAspect(
    width,
    height
) {

    if (!height) {
        return "Unknown";
    }


    return (
        width / height
    ).toFixed(2);

}


function classifyEdge(
    value
) {

    if (value < 1.5) {
        return "Low";
    }


    if (value < 4) {
        return "Normal";
    }


    return "High";

}


function classifyNoise(
    value
) {

    if (value < 1) {
        return "Low";
    }


    if (value < 4) {
        return "Normal";
    }


    return "High";

}


function classifyCompression(
    value
) {

    if (value < 3) {
        return "Low";
    }


    if (value < 8) {
        return "Moderate";
    }


    return "Strong";

}


function classifyColor(
    value
) {

    if (value < 15) {
        return "Balanced";
    }


    if (value < 35) {
        return "Moderate Bias";
    }


    return "Strong Channel Bias";

}


function updateAIStatus(
    text
) {

    console.log(
        "AI status:",
        text
    );

}


/* =========================================================
   IMAGE LOADER
   ========================================================= */

function loadImage(
    file
) {

    return new Promise(
        function (resolve, reject) {

            const url =
                URL.createObjectURL(
                    file
                );


            const image =
                new Image();


            image.onload =
                function () {

                    URL.revokeObjectURL(
                        url
                    );


                    resolve(
                        image
                    );

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        url
                    );


                    reject(
                        new Error(
                            "Unable to read image."
                        )
                    );

                };


            image.src =
                url;

        }
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showFileError(
    message
) {

    if (!fileSelected) {

        alert(message);

        return;

    }


    fileSelected.classList.add(
        "file-selected"
    );


    fileSelected.innerHTML = `

        <strong style="color:#ff7b7b">

            ⚠️
            ${escapeHTML(message)}

        </strong>

    `;

}


/* =========================================================
   UTILITIES
   ========================================================= */

function formatBytes(
    bytes
) {

    if (!bytes) {
        return "0 B";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.min(
            units.length - 1,
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            )
        );


    return (

        bytes /
        Math.pow(
            1024,
            index
        )

    ).toFixed(2)
    + " "
    + units[index];

}


function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   DEBUG API
   ========================================================= */

window.DeepShield = {

    getSelectedFile() {

        return selectedFile;

    },


    getAIStatus() {

        return {

            loaded:
                !!aiClassifier,

            loading:
                aiLoading,

            model:
                CONFIG.MODEL_ID

        };

    },


    reloadAI() {

        aiClassifier = null;

        return loadAIModel();

    }

};


/* =========================================================
   START
   ========================================================= */

/*
   Because this script is loaded at the bottom
   of index.html, the DOM already exists.
*/

initializeDeepShield();


console.log(
    "DeepShield AI v0.7 loaded successfully."
);
