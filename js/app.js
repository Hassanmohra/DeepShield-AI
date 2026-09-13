"use strict";

/*
 * DeepShield AI
 * Client-side Media Forensics Engine
 *
 * Version: 0.2
 *
 * Features:
 * - Image / video upload
 * - Drag & drop
 * - File validation
 * - Real image pixel analysis
 * - Luminance statistics
 * - Color distribution
 * - Saturation analysis
 * - Entropy estimation
 * - Edge / sharpness estimation
 * - Noise estimation
 * - Compression / blockiness estimation
 * - Deterministic forensic anomaly score
 *
 * IMPORTANT:
 * This is a heuristic forensic analyzer.
 * It is NOT a trained Deep Learning deepfake detector.
 */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       DOM ELEMENTS
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

    const scoreElement =
        document.getElementById("score");


    const chooseMediaButton =
        document.getElementById("chooseMedia") ||
        document.getElementById("chooseMediaBtn") ||
        document.getElementById("uploadButton") ||
        document.getElementById("browseButton") ||
        document.querySelector(".choose-media") ||
        document.querySelector(".upload-button") ||
        document.querySelector(".browse-button");


    /* =========================================================
       REQUIRED ELEMENT CHECK
    ========================================================= */

    if (!fileInput) {

        console.error(
            "DeepShield AI: #fileInput was not found."
        );

        return;
    }


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const CONFIG = {

        maxFileSize:
            200 * 1024 * 1024,

        allowedImageTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ],

        allowedVideoTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo"
        ],

        allowedExtensions: [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".mp4",
            ".webm",
            ".mov",
            ".avi"
        ],

        /*
         * Images are resized for analysis.
         * This keeps browser processing fast.
         */

        analysisMaxDimension: 420,

        /*
         * Number of pixels used in detailed
         * calculations.
         */

        maxAnalysisPixels: 170000

    };


    /* =========================================================
       STATE
    ========================================================= */

    let selectedFile = null;

    let analysisInProgress = false;


    /* =========================================================
       FILE SELECTOR
    ========================================================= */

    function openFileSelector(event) {

        if (event) {

            event.preventDefault();

            event.stopPropagation();

        }


        if (
            fileInput &&
            !analysisInProgress
        ) {

            fileInput.click();

        }

    }


    /* =========================================================
       DROP ZONE CLICK
    ========================================================= */

    if (dropZone) {

        dropZone.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest("button") ||
                    event.target.closest("input")
                ) {

                    return;

                }

                openFileSelector(event);

            }
        );

    }


    /* =========================================================
       CUSTOM UPLOAD BUTTON
    ========================================================= */

    if (chooseMediaButton) {

        chooseMediaButton.addEventListener(
            "click",
            event => {

                openFileSelector(event);

            }
        );

    }


    /* =========================================================
       FILE INPUT
    ========================================================= */

    fileInput.addEventListener(
        "change",
        event => {

            const files =
                event.target.files;

            if (
                !files ||
                files.length === 0
            ) {

                return;

            }

            processSelectedFile(
                files[0]
            );

        }
    );


    /* =========================================================
       DRAG EVENTS
    ========================================================= */

    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        dropZone.addEventListener(
            "dragenter",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        dropZone.addEventListener(
            "dragleave",
            event => {

                event.preventDefault();

                if (
                    event.target === dropZone
                ) {

                    dropZone.classList.remove(
                        "dragover"
                    );

                }

            }
        );


        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                dropZone.classList.remove(
                    "dragover"
                );

                const files =
                    event.dataTransfer.files;

                if (
                    !files ||
                    files.length === 0
                ) {

                    return;

                }

                processSelectedFile(
                    files[0]
                );

            }
        );

    }


    /* =========================================================
       PROCESS FILE
    ========================================================= */

    function processSelectedFile(file) {

        if (!file) {

            return;

        }


        const validation =
            validateFile(file);


        if (!validation.valid) {

            showMessage(
                validation.message,
                "error"
            );

            resetSelection();

            return;

        }


        selectedFile =
            file;


        displaySelectedFile(
            file
        );


        resetAnalysis();


        if (scanButton) {

            scanButton.disabled =
                false;

            scanButton.style.opacity =
                "1";

            scanButton.style.cursor =
                "pointer";

        }


        console.log(
            "DeepShield AI: Selected:",
            file.name
        );

    }


    /* =========================================================
       VALIDATE FILE
    ========================================================= */

    function validateFile(file) {

        if (!file) {

            return {
                valid: false,
                message:
                    "No file selected."
            };

        }


        if (
            file.size >
            CONFIG.maxFileSize
        ) {

            return {
                valid: false,
                message:
                    "File is too large. Maximum size is 200 MB."
            };

        }


        const extension =
            getFileExtension(
                file.name
            );


        const validType =
            CONFIG.allowedImageTypes.includes(
                file.type
            ) ||
            CONFIG.allowedVideoTypes.includes(
                file.type
            );


        const validExtension =
            CONFIG.allowedExtensions.includes(
                extension
            );


        if (
            !validType &&
            !validExtension
        ) {

            return {
                valid: false,
                message:
                    "Unsupported file type. Please upload an image or video."
            };

        }


        return {
            valid: true
        };

    }


    /* =========================================================
       DISPLAY SELECTED FILE
    ========================================================= */

    function displaySelectedFile(file) {

        if (!fileSelected) {

            return;

        }


        fileSelected.style.display =
            "block";


        fileSelected.innerHTML = `
            ✓ <strong>${escapeHTML(file.name)}</strong>
            <br>
            <span style="opacity:0.75;">
                ${escapeHTML(
                    file.type || "Unknown media type"
                )}
                •
                ${formatFileSize(file.size)}
            </span>
        `;


        if (dropZone) {

            dropZone.classList.add(
                "file-selected"
            );

        }

    }


    /* =========================================================
       START ANALYSIS
    ========================================================= */

    if (scanButton) {

        scanButton.addEventListener(
            "click",
            async () => {

                if (analysisInProgress) {

                    return;

                }


                if (!selectedFile) {

                    showMessage(
                        "Please select an image or video first.",
                        "warning"
                    );

                    return;

                }


                analysisInProgress =
                    true;


                setButtonState(
                    "Analyzing Media...",
                    true
                );


                try {

                    const report =
                        await performLocalAnalysis(
                            selectedFile
                        );


                    displayAnalysisResult(
                        report
                    );

                }

                catch (error) {

                    console.error(
                        "DeepShield analysis error:",
                        error
                    );


                    showMessage(
                        "An error occurred while analyzing the media.",
                        "error"
                    );

                }

                finally {

                    analysisInProgress =
                        false;


                    setButtonState(
                        "Start AI Analysis",
                        false
                    );

                }

            }
        );

    }


    /* =========================================================
       MAIN ANALYSIS ENGINE
    ========================================================= */

    async function performLocalAnalysis(file) {

        const metadata =
            await inspectMedia(file);


        let pixelAnalysis =
            null;


        /*
         * Real pixel analysis is currently
         * performed for images.
         */

        if (
            getMediaType(file) === "image"
        ) {

            pixelAnalysis =
                await analyzeImagePixels(
                    file
                );

        }


        const indicators =
            generateForensicIndicators(
                file,
                metadata,
                pixelAnalysis
            );


        const score =
            calculateForensicScore(
                file,
                metadata,
                pixelAnalysis,
                indicators
            );


        return {

            fileName:
                file.name,

            fileSize:
                file.size,

            fileType:
                file.type,

            mediaType:
                getMediaType(file),

            metadata,

            pixelAnalysis,

            indicators,

            score,

            risk:
                getRiskLevel(score),

            generatedAt:
                new Date().toISOString(),

            engine:
                "DeepShield Visual Forensics v0.2",

            disclaimer:
                "Heuristic forensic analysis. Not a definitive deepfake verdict."

        };

    }


    /* =========================================================
       MEDIA INSPECTION
    ========================================================= */

    function inspectMedia(file) {

        return new Promise(resolve => {

            const mediaType =
                getMediaType(file);


            /* -------------------------
               IMAGE
            ------------------------- */

            if (
                mediaType === "image"
            ) {

                const image =
                    new Image();


                const objectURL =
                    URL.createObjectURL(file);


                image.onload = () => {

                    const metadata = {

                        width:
                            image.naturalWidth,

                        height:
                            image.naturalHeight,

                        aspectRatio:
                            calculateAspectRatio(
                                image.naturalWidth,
                                image.naturalHeight
                            ),

                        format:
                            file.type ||
                            "unknown"

                    };


                    URL.revokeObjectURL(
                        objectURL
                    );


                    resolve(
                        metadata
                    );

                };


                image.onerror = () => {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    resolve({

                        format:
                            file.type ||
                            "unknown"

                    });

                };


                image.src =
                    objectURL;


                return;

            }


            /* -------------------------
               VIDEO
            ------------------------- */

            if (
                mediaType === "video"
            ) {

                const video =
                    document.createElement(
                        "video"
                    );


                const objectURL =
                    URL.createObjectURL(file);


                video.preload =
                    "metadata";


                video.onloadedmetadata =
                    () => {

                        const metadata = {

                            width:
                                video.videoWidth,

                            height:
                                video.videoHeight,

                            duration:
                                Number(
                                    video.duration.toFixed(
                                        2
                                    )
                                ),

                            aspectRatio:
                                calculateAspectRatio(
                                    video.videoWidth,
                                    video.videoHeight
                                ),

                            format:
                                file.type ||
                                "unknown"

                        };


                        URL.revokeObjectURL(
                            objectURL
                        );


                        resolve(
                            metadata
                        );

                    };


                video.onerror = () => {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    resolve({

                        format:
                            file.type ||
                            "unknown"

                    });

                };


                video.src =
                    objectURL;


                return;

            }


            resolve({});

        });

    }


    /* =========================================================
       REAL IMAGE PIXEL ANALYSIS
    ========================================================= */

    function analyzeImagePixels(file) {

        return new Promise(
            (resolve, reject) => {

                const image =
                    new Image();


                const objectURL =
                    URL.createObjectURL(
                        file
                    );


                image.onload = () => {

                    try {

                        const originalWidth =
                            image.naturalWidth;

                        const originalHeight =
                            image.naturalHeight;


                        /*
                         * Resize image while keeping
                         * aspect ratio.
                         */

                        let width =
                            originalWidth;

                        let height =
                            originalHeight;


                        const maxDimension =
                            CONFIG.analysisMaxDimension;


                        if (
                            Math.max(
                                width,
                                height
                            ) >
                            maxDimension
                        ) {

                            const scale =
                                maxDimension /
                                Math.max(
                                    width,
                                    height
                                );


                            width =
                                Math.max(
                                    1,
                                    Math.round(
                                        width *
                                        scale
                                    )
                                );


                            height =
                                Math.max(
                                    1,
                                    Math.round(
                                        height *
                                        scale
                                    )
                                );

                        }


                        /*
                         * Prevent extremely large
                         * canvas processing.
                         */

                        let pixelCount =
                            width *
                            height;


                        if (
                            pixelCount >
                            CONFIG.maxAnalysisPixels
                        ) {

                            const scale =
                                Math.sqrt(
                                    CONFIG.maxAnalysisPixels /
                                    pixelCount
                                );


                            width =
                                Math.max(
                                    1,
                                    Math.round(
                                        width *
                                        scale
                                    )
                                );


                            height =
                                Math.max(
                                    1,
                                    Math.round(
                                        height *
                                        scale
                                    )
                                );

                        }


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
                                    willReadFrequently:
                                        true
                                }
                            );


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


                        const result =
                            calculatePixelStatistics(
                                imageData.data,
                                width,
                                height
                            );


                        result.originalWidth =
                            originalWidth;

                        result.originalHeight =
                            originalHeight;

                        result.analyzedWidth =
                            width;

                        result.analyzedHeight =
                            height;


                        URL.revokeObjectURL(
                            objectURL
                        );


                        resolve(
                            result
                        );

                    }

                    catch (error) {

                        URL.revokeObjectURL(
                            objectURL
                        );

                        reject(error);

                    }

                };


                image.onerror = () => {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    reject(
                        new Error(
                            "Unable to decode image."
                        )
                    );

                };


                image.src =
                    objectURL;

            }
        );

    }


    /* =========================================================
       PIXEL STATISTICS
    ========================================================= */

    function calculatePixelStatistics(
        data,
        width,
        height
    ) {

        const pixelCount =
            width *
            height;


        /*
         * Grayscale histogram.
         */

        const histogram =
            new Array(256).fill(0);


        let sumR = 0;
        let sumG = 0;
        let sumB = 0;

        let sumL = 0;
        let sumL2 = 0;

        let sumS = 0;
        let sumS2 = 0;


        /*
         * First pass.
         */

        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            const r =
                data[i];

            const g =
                data[i + 1];

            const b =
                data[i + 2];


            const luminance =
                0.2126 * r +
                0.7152 * g +
                0.0722 * b;


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


            const saturation =
                max === 0
                    ? 0
                    : (
                        (max - min) /
                        max
                    );


            const gray =
                Math.max(
                    0,
                    Math.min(
                        255,
                        Math.round(
                            luminance
                        )
                    )
                );


            histogram[gray]++;


            sumR += r;
            sumG += g;
            sumB += b;

            sumL += luminance;
            sumL2 +=
                luminance *
                luminance;

            sumS += saturation;
            sumS2 +=
                saturation *
                saturation;

        }


        const meanR =
            sumR /
            pixelCount;


        const meanG =
            sumG /
            pixelCount;


        const meanB =
            sumB /
            pixelCount;


        const meanL =
            sumL /
            pixelCount;


        const varianceL =
            Math.max(
                0,
                (
                    sumL2 /
                    pixelCount
                ) -
                (
                    meanL *
                    meanL
                )
            );


        const stdL =
            Math.sqrt(
                varianceL
            );


        const meanS =
            sumS /
            pixelCount;


        const varianceS =
            Math.max(
                0,
                (
                    sumS2 /
                    pixelCount
                ) -
                (
                    meanS *
                    meanS
                )
            );


        const stdS =
            Math.sqrt(
                varianceS
            );


        /*
         * Histogram entropy.
         */

        let entropy = 0;


        for (
            let i = 0;
            i < histogram.length;
            i++
        ) {

            if (
                histogram[i] === 0
            ) {

                continue;

            }


            const p =
                histogram[i] /
                pixelCount;


            entropy -=
                p *
                Math.log2(p);

        }


        /*
         * Second pass:
         * edge / texture / noise / blockiness.
         */

        let edgeSum = 0;

        let edgeSamples = 0;

        let noiseSum = 0;

        let noiseSamples = 0;

        let blockBoundarySum = 0;

        let blockInteriorSum = 0;

        let blockBoundarySamples = 0;

        let blockInteriorSamples = 0;


        /*
         * Helper for grayscale.
         */

        function getGray(x, y) {

            const index =
                (
                    y *
                    width +
                    x
                ) *
                4;


            return (
                0.2126 * data[index] +
                0.7152 * data[index + 1] +
                0.0722 * data[index + 2]
            );

        }


        /*
         * Sample every few pixels for speed.
         */

        const step =
            Math.max(
                1,
                Math.floor(
                    Math.sqrt(
                        pixelCount /
                        80000
                    )
                )
            );


        for (
            let y = 1;
            y < height - 1;
            y += step
        ) {

            for (
                let x = 1;
                x < width - 1;
                x += step
            ) {

                const current =
                    getGray(
                        x,
                        y
                    );


                const right =
                    getGray(
                        x + 1,
                        y
                    );


                const down =
                    getGray(
                        x,
                        y + 1
                    );


                const left =
                    getGray(
                        x - 1,
                        y
                    );


                const up =
                    getGray(
                        x,
                        y - 1
                    );


                /*
                 * Local gradient.
                 */

                const gradient =
                    (
                        Math.abs(
                            current -
                            right
                        ) +
                        Math.abs(
                            current -
                            down
                        )
                    ) / 2;


                edgeSum +=
                    gradient;


                edgeSamples++;


                /*
                 * High-frequency residual:
                 * compares pixel to neighborhood average.
                 */

                const neighborAverage =
                    (
                        right +
                        down +
                        left +
                        up
                    ) / 4;


                const residual =
                    Math.abs(
                        current -
                        neighborAverage
                    );


                noiseSum +=
                    residual;


                noiseSamples++;


                /*
                 * JPEG-like 8x8 block boundary
                 * estimation.
                 */

                if (
                    x % 8 === 0
                ) {

                    blockBoundarySum +=
                        Math.abs(
                            current -
                            left
                        );

                    blockBoundarySamples++;

                }
                else {

                    blockInteriorSum +=
                        Math.abs(
                            current -
                            left
                        );

                    blockInteriorSamples++;

                }

            }

        }


        const edgeStrength =
            edgeSamples > 0
                ? edgeSum /
                  edgeSamples
                : 0;


        const noiseLevel =
            noiseSamples > 0
                ? noiseSum /
                  noiseSamples
                : 0;


        const boundaryAverage =
            blockBoundarySamples > 0
                ? blockBoundarySum /
                  blockBoundarySamples
                : 0;


        const interiorAverage =
            blockInteriorSamples > 0
                ? blockInteriorSum /
                  blockInteriorSamples
                : 0;


        const blockinessRatio =
            interiorAverage > 0
                ? boundaryAverage /
                  interiorAverage
                : 1;


        /*
         * Channel balance.
         */

        const channelMean =
            (
                meanR +
                meanG +
                meanB
            ) / 3;


        const channelDeviation =
            Math.sqrt(
                (
                    Math.pow(
                        meanR -
                        channelMean,
                        2
                    ) +
                    Math.pow(
                        meanG -
                        channelMean,
                        2
                    ) +
                    Math.pow(
                        meanB -
                        channelMean,
                        2
                    )
                ) / 3
            );


        return {

            meanRed:
                round(meanR),

            meanGreen:
                round(meanG),

            meanBlue:
                round(meanB),

            luminanceMean:
                round(meanL),

            luminanceStd:
                round(stdL),

            saturationMean:
                round(
                    meanS * 100
                ),

            saturationStd:
                round(
                    stdS * 100
                ),

            entropy:
                round(entropy, 3),

            edgeStrength:
                round(edgeStrength, 3),

            noiseLevel:
                round(noiseLevel, 3),

            blockinessRatio:
                round(blockinessRatio, 3),

            channelDeviation:
                round(channelDeviation, 3),

            histogramRange:
                calculateHistogramRange(
                    histogram,
                    pixelCount
                )

        };

    }


    /* =========================================================
       HISTOGRAM RANGE
    ========================================================= */

    function calculateHistogramRange(
        histogram,
        totalPixels
    ) {

        const threshold =
            totalPixels *
            0.01;


        let low =
            0;


        let high =
            255;


        let accumulated =
            0;


        for (
            let i = 0;
            i < 256;
            i++
        ) {

            accumulated +=
                histogram[i];


            if (
                accumulated >=
                threshold
            ) {

                low = i;

                break;

            }

        }


        accumulated =
            0;


        for (
            let i = 255;
            i >= 0;
            i--
        ) {

            accumulated +=
                histogram[i];


            if (
                accumulated >=
                threshold
            ) {

                high = i;

                break;

            }

        }


        return {

            low,

            high,

            range:
                high - low

        };

    }


    /* =========================================================
       FORENSIC INDICATORS
    ========================================================= */

    function generateForensicIndicators(
        file,
        metadata,
        pixels
    ) {

        const indicators = [];


        /*
         * File structure
         */

        indicators.push({

            name:
                "File Structure",

            status:
                file.size > 0
                    ? "Normal"
                    : "Suspicious",

            severity:
                file.size > 0
                    ? "low"
                    : "high"

        });


        /*
         * Resolution
         */

        if (
            metadata.width &&
            metadata.height
        ) {

            const pixelsCount =
                metadata.width *
                metadata.height;


            indicators.push({

                name:
                    "Media Resolution",

                status:
                    pixelsCount >= 100000
                        ? "Valid"
                        : "Low Resolution",

                severity:
                    pixelsCount >= 100000
                        ? "low"
                        : "medium"

            });

        }


        /*
         * Aspect ratio
         */

        if (
            metadata.aspectRatio
        ) {

            const unusual =
                metadata.aspectRatio < 0.3 ||
                metadata.aspectRatio > 3.5;


            indicators.push({

                name:
                    "Aspect Ratio",

                status:
                    unusual
                        ? "Unusual"
                        : "Normal",

                severity:
                    unusual
                        ? "medium"
                        : "low"

            });

        }


        /*
         * Actual pixel analysis
         */

        if (pixels) {

            /*
             * Sharpness
             */

            indicators.push({

                name:
                    "Edge Detail",

                status:
                    classifyEdgeStrength(
                        pixels.edgeStrength
                    ),

                severity:
                    edgeSeverity(
                        pixels.edgeStrength
                    )

            });


            /*
             * Noise
             */

            indicators.push({

                name:
                    "Noise Profile",

                status:
                    classifyNoise(
                        pixels.noiseLevel
                    ),

                severity:
                    noiseSeverity(
                        pixels.noiseLevel
                    )

            });


            /*
             * Entropy
             */

            indicators.push({

                name:
                    "Image Entropy",

                status:
                    classifyEntropy(
                        pixels.entropy
                    ),

                severity:
                    entropySeverity(
                        pixels.entropy
                    )

            });


            /*
             * Compression
             */

            indicators.push({

                name:
                    "Compression Pattern",

                status:
                    classifyBlockiness(
                        pixels.blockinessRatio
                    ),

                severity:
                    blockinessSeverity(
                        pixels.blockinessRatio
                    )

            });


            /*
             * Color
             */

            indicators.push({

                name:
                    "Color Distribution",

                status:
                    classifyColorDistribution(
                        pixels
                    ),

                severity:
                    colorSeverity(
                        pixels
                    )

            });


            /*
             * Histogram
             */

            indicators.push({

                name:
                    "Histogram Spread",

                status:
                    `${pixels.histogramRange.range} / 255`,

                severity:
                    pixels.histogramRange.range < 80
                        ? "medium"
                        : "low"

            });

        }


        /*
         * File extension
         */

        const extension =
            getFileExtension(
                file.name
            );


        indicators.push({

            name:
                "File Extension",

            status:
                CONFIG.allowedExtensions.includes(
                    extension
                )
                    ? "Supported"
                    : "Unknown",

            severity:
                CONFIG.allowedExtensions.includes(
                    extension
                )
                    ? "low"
                    : "medium"

        });


        return indicators;

    }


    /* =========================================================
       FORENSIC SCORE
       ========================================================= */

    function calculateForensicScore(
        file,
        metadata,
        pixels,
        indicators
    ) {

        /*
         * IMPORTANT:
         * This score represents anomaly signals,
         * NOT deepfake probability.
         */

        if (!pixels) {

            /*
             * Videos currently receive a
             * metadata-based score.
             */

            let videoScore =
                10;


            if (
                metadata.duration &&
                metadata.duration < 1
            ) {

                videoScore += 10;

            }


            return clamp(
                videoScore,
                1,
                99
            );

        }


        let score = 5;


        /*
         * Very low entropy can indicate
         * overly smooth / simplified imagery.
         */

        if (
            pixels.entropy < 3.5
        ) {

            score += 10;

        }
        else if (
            pixels.entropy < 4.5
        ) {

            score += 4;

        }


        /*
         * Very high or very low noise.
         */

        if (
            pixels.noiseLevel < 0.8
        ) {

            score += 8;

        }
        else if (
            pixels.noiseLevel > 15
        ) {

            score += 7;

        }


        /*
         * Extremely weak edge structure.
         */

        if (
            pixels.edgeStrength < 2
        ) {

            score += 8;

        }


        /*
         * Strong block boundary pattern.
         */

        if (
            pixels.blockinessRatio > 1.35
        ) {

            score += 12;

        }
        else if (
            pixels.blockinessRatio > 1.18
        ) {

            score += 5;

        }


        /*
         * Very narrow histogram.
         */

        if (
            pixels.histogramRange.range < 60
        ) {

            score += 8;

        }
        else if (
            pixels.histogramRange.range < 100
        ) {

            score += 3;

        }


        /*
         * Unusual color-channel imbalance.
         */

        if (
            pixels.channelDeviation > 35
        ) {

            score += 7;

        }


        /*
         * Very high saturation uniformity.
         */

        if (
            pixels.saturationStd < 4 &&
            pixels.saturationMean > 60
        ) {

            score += 5;

        }


        /*
         * Large images are not automatically
         * suspicious. Only use file-size ratio
         * as a weak signal.
         */

        if (
            metadata.width &&
            metadata.height
        ) {

            const megapixels =
                (
                    metadata.width *
                    metadata.height
                ) / 1000000;


            if (
                megapixels > 2 &&
                file.size < 100000
            ) {

                score += 4;

            }

        }


        /*
         * Add only a small contribution
         * from generic indicators.
         */

        const mediumIndicators =
            indicators.filter(
                item =>
                    item.severity === "medium"
            ).length;


        score +=
            Math.min(
                mediumIndicators * 2,
                8
            );


        return clamp(
            Math.round(score),
            1,
            99
        );

    }


    /* =========================================================
       CLASSIFICATION FUNCTIONS
    ========================================================= */

    function classifyEdgeStrength(value) {

        if (value < 2) {

            return "Very Low";

        }

        if (value < 5) {

            return "Low";

        }

        if (value < 12) {

            return "Normal";

        }

        if (value < 25) {

            return "High";

        }

        return "Very High";

    }


    function edgeSeverity(value) {

        if (
            value < 2
        ) {

            return "medium";

        }

        if (
            value > 40
        ) {

            return "medium";

        }

        return "low";

    }


    function classifyNoise(value) {

        if (value < 0.8) {

            return "Very Low";

        }

        if (value < 2.5) {

            return "Low";

        }

        if (value < 7) {

            return "Normal";

        }

        if (value < 15) {

            return "High";

        }

        return "Very High";

    }


    function noiseSeverity(value) {

        if (
            value < 0.8 ||
            value > 15
        ) {

            return "medium";

        }

        return "low";

    }


    function classifyEntropy(value) {

        if (value < 3.5) {

            return "Low Complexity";

        }

        if (value < 5) {

            return "Moderate";

        }

        if (value < 7) {

            return "High Complexity";

        }

        return "Very High";

    }


    function entropySeverity(value) {

        if (
            value < 3.5
        ) {

            return "medium";

        }

        return "low";

    }


    function classifyBlockiness(value) {

        if (value < 1.08) {

            return "Low";

        }

        if (value < 1.18) {

            return "Normal";

        }

        if (value < 1.35) {

            return "Elevated";

        }

        return "Strong";

    }


    function blockinessSeverity(value) {

        if (
            value > 1.35
        ) {

            return "medium";

        }

        return "low";

    }


    function classifyColorDistribution(pixels) {

        if (
            pixels.channelDeviation > 35
        ) {

            return "Strong Channel Bias";

        }

        if (
            pixels.saturationMean > 75
        ) {

            return "Highly Saturated";

        }

        if (
            pixels.saturationMean < 8
        ) {

            return "Low Saturation";

        }

        return "Balanced";

    }


    function colorSeverity(pixels) {

        if (
            pixels.channelDeviation > 35
        ) {

            return "medium";

        }

        return "low";

    }


    /* =========================================================
       RISK LEVEL
       ========================================================= */

    function getRiskLevel(score) {

        if (
            score >= 70
        ) {

            return "HIGH";

        }


        if (
            score >= 40
        ) {

            return "MEDIUM";

        }


        return "LOW";

    }


    /* =========================================================
       DISPLAY RESULT
    ========================================================= */

    function displayAnalysisResult(report) {

        if (
            !resultEmpty ||
            !analysisResult
        ) {

            return;

        }


        resultEmpty.style.display =
            "none";


        analysisResult.style.display =
            "block";


        if (scoreElement) {

            scoreElement.textContent =
                `${report.score}%`;

        }


        updateRiskLabel(
            report.risk
        );


        updateIndicators(
            report.indicators
        );


        updateAnalysisDetails(
            report
        );

    }


    /* =========================================================
       RISK LABEL
    ========================================================= */

    function updateRiskLabel(risk) {

        const riskElement =
            analysisResult.querySelector(
                ".risk"
            );


        if (!riskElement) {

            return;

        }


        riskElement.textContent =
            `${risk} ANOMALY`;

    }


    /* =========================================================
       INDICATORS UI
    ========================================================= */

    function updateIndicators(
        indicators
    ) {

        const container =
            analysisResult.querySelector(
                ".indicators"
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            "";


        indicators.forEach(
            indicator => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "indicator";


                const name =
                    document.createElement(
                        "span"
                    );


                name.textContent =
                    indicator.name;


                const value =
                    document.createElement(
                        "span"
                    );


                value.textContent =
                    indicator.status;


                row.appendChild(
                    name
                );


                row.appendChild(
                    value
                );


                container.appendChild(
                    row
                );

            }
        );

    }


    /* =========================================================
       ANALYSIS DETAILS
    ========================================================= */

    function updateAnalysisDetails(
        report
    ) {

        let details =
            document.getElementById(
                "analysisDetails"
            );


        if (!details) {

            details =
                document.createElement(
                    "div"
                );


            details.id =
                "analysisDetails";


            details.style.marginTop =
                "18px";


            details.style.padding =
                "14px";


            details.style.borderRadius =
                "12px";


            details.style.background =
                "rgba(255,255,255,0.025)";


            details.style.border =
                "1px solid rgba(255,255,255,0.06)";


            details.style.fontSize =
                "11px";


            details.style.lineHeight =
                "1.7";


            analysisResult.appendChild(
                details
            );

        }


        const dimensions =
            report.metadata.width &&
            report.metadata.height
                ? `${report.metadata.width} × ${report.metadata.height}`
                : "N/A";


        let pixelDetails =
            "";


        if (report.pixelAnalysis) {

            const p =
                report.pixelAnalysis;


            pixelDetails = `
                <br>
                <br>
                <strong>Pixel Forensics</strong>
                <br>
                Luminance Mean:
                ${p.luminanceMean}
                <br>
                Luminance Std:
                ${p.luminanceStd}
                <br>
                Saturation:
                ${p.saturationMean}%
                <br>
                Entropy:
                ${p.entropy}
                <br>
                Edge Strength:
                ${p.edgeStrength}
                <br>
                Noise Level:
                ${p.noiseLevel}
                <br>
                Blockiness:
                ${p.blockinessRatio}
                <br>
                Histogram Range:
                ${p.histogramRange.range}
            `;

        }


        details.innerHTML = `
            <strong>Forensic Information</strong>
            <br>
            File:
            ${escapeHTML(report.fileName)}
            <br>
            Type:
            ${escapeHTML(report.mediaType)}
            <br>
            Size:
            ${formatFileSize(report.fileSize)}
            <br>
            Resolution:
            ${dimensions}
            <br>
            Engine:
            ${escapeHTML(report.engine)}
            ${pixelDetails}
            <br>
            <br>
            <span style="opacity:0.65;">
                ⚠ ${escapeHTML(report.disclaimer)}
            </span>
        `;

    }


    /* =========================================================
       RESET ANALYSIS
    ========================================================= */

    function resetAnalysis() {

        if (resultEmpty) {

            resultEmpty.style.display =
                "flex";

        }


        if (analysisResult) {

            analysisResult.style.display =
                "none";

        }

    }


    /* =========================================================
       RESET SELECTION
    ========================================================= */

    function resetSelection() {

        selectedFile =
            null;


        fileInput.value =
            "";


        if (fileSelected) {

            fileSelected.style.display =
                "none";

            fileSelected.textContent =
                "";

        }


        if (dropZone) {

            dropZone.classList.remove(
                "file-selected"
            );

        }


        resetAnalysis();


        if (scanButton) {

            scanButton.disabled =
                true;

            scanButton.style.opacity =
                "0.6";

            scanButton.style.cursor =
                "not-allowed";

        }

    }


    /* =========================================================
       BUTTON STATE
    ========================================================= */

    function setButtonState(
        text,
        disabled
    ) {

        if (!scanButton) {

            return;

        }


        scanButton.textContent =
            text;


        scanButton.disabled =
            disabled;


        scanButton.style.opacity =
            disabled
                ? "0.7"
                : "1";


        scanButton.style.cursor =
            disabled
                ? "wait"
                : "pointer";

    }


    /* =========================================================
       MESSAGE
    ========================================================= */

    function showMessage(
        message,
        type
    ) {

        if (
            type === "error"
        ) {

            console.error(
                message
            );

        }


        alert(
            message
        );

    }


    /* =========================================================
       MEDIA TYPE
    ========================================================= */

    function getMediaType(file) {

        if (
            file.type &&
            file.type.startsWith(
                "image/"
            )
        ) {

            return "image";

        }


        if (
            file.type &&
            file.type.startsWith(
                "video/"
            )
        ) {

            return "video";

        }


        const extension =
            getFileExtension(
                file.name
            );


        const imageExtensions = [

            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif"

        ];


        if (
            imageExtensions.includes(
                extension
            )
        ) {

            return "image";

        }


        return "video";

    }


    /* =========================================================
       FILE EXTENSION
    ========================================================= */

    function getFileExtension(
        filename
    ) {

        const parts =
            filename
                .toLowerCase()
                .split(".");


        if (
            parts.length < 2
        ) {

            return "";

        }


        return "." +
            parts.pop();

    }


    /* =========================================================
       FILE SIZE
    ========================================================= */

    function formatFileSize(
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


        let size =
            bytes;


        let index =
            0;


        while (
            size >= 1024 &&
            index <
                units.length - 1
        ) {

            size /=
                1024;

            index++;

        }


        return `${size.toFixed(
            size >= 10 ||
            index === 0
                ? 0
                : 1
        )} ${units[index]}`;

    }


    /* =========================================================
       ASPECT RATIO
    ========================================================= */

    function calculateAspectRatio(
        width,
        height
    ) {

        if (
            !width ||
            !height
        ) {

            return null;

        }


        return Number(
            (
                width /
                height
            ).toFixed(3)
        );

    }


    /* =========================================================
       ROUND
    ========================================================= */

    function round(
        value,
        decimals = 2
    ) {

        const factor =
            Math.pow(
                10,
                decimals
            );


        return Math.round(
            value *
            factor
        ) / factor;

    }


    /* =========================================================
       CLAMP
    ========================================================= */

    function clamp(
        value,
        min,
        max
    ) {

        return Math.min(
            Math.max(
                value,
                min
            ),
            max
        );

    }


    /* =========================================================
       HTML ESCAPE
    ========================================================= */

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
       INITIALIZATION
    ========================================================= */

    resetSelection();


    fileInput.setAttribute(
        "accept",
        [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo"
        ].join(",")
    );


    console.log(
        "DeepShield AI initialized successfully."
    );


    console.log(
        "Visual Forensics Engine v0.2 ready."
    );

});
