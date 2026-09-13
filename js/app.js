"use strict";

/*
 * DeepShield AI
 * Client-side media analysis controller
 *
 * Features:
 * - File selection
 * - Custom upload button support
 * - Upload area click support
 * - Drag & drop
 * - File validation
 * - Media metadata inspection
 * - Local forensic indicators
 * - Analysis report generation
 */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       DOM ELEMENTS
    ============================== */

    const fileInput = document.getElementById("fileInput");
    const dropZone = document.getElementById("dropZone");
    const fileSelected = document.getElementById("fileSelected");
    const scanButton = document.getElementById("scanButton");

    const resultEmpty = document.getElementById("resultEmpty");
    const analysisResult = document.getElementById("analysisResult");
    const scoreElement = document.getElementById("score");

    /*
     * Try to find the visible upload button.
     * This supports several common IDs/classes
     * without requiring changes to index.html.
     */

    const chooseMediaButton =
        document.getElementById("chooseMedia") ||
        document.getElementById("chooseMediaBtn") ||
        document.getElementById("uploadButton") ||
        document.getElementById("browseButton") ||
        document.querySelector(".choose-media") ||
        document.querySelector(".upload-button") ||
        document.querySelector(".browse-button");


    /* ==============================
       REQUIRED ELEMENT CHECK
    ============================== */

    if (!fileInput) {

        console.error(
            "DeepShield AI: #fileInput was not found."
        );

        return;
    }


    if (!dropZone) {

        console.warn(
            "DeepShield AI: #dropZone was not found."
        );

    }


    if (!scanButton) {

        console.warn(
            "DeepShield AI: #scanButton was not found."
        );

    }


    /* ==============================
       CONFIGURATION
    ============================== */

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
        ]

    };


    /* ==============================
       STATE
    ============================== */

    let selectedFile = null;
    let analysisInProgress = false;


    /* ==============================
       OPEN FILE SELECTOR
    ============================== */

    function openFileSelector(event) {

        /*
         * Prevent a nested button/link from
         * triggering the upload area twice.
         */

        if (
            event &&
            event.target &&
            (
                event.target.tagName === "INPUT" ||
                event.target.tagName === "BUTTON"
            )
        ) {

            if (
                event.target !== fileInput
            ) {

                event.stopPropagation();

            }

        }


        if (
            fileInput &&
            !analysisInProgress
        ) {

            fileInput.click();

        }

    }


    /* ==============================
       UPLOAD AREA CLICK
    ============================== */

    if (dropZone) {

        dropZone.addEventListener(
            "click",
            event => {

                /*
                 * Do not trigger the hidden
                 * file input if the user clicked
                 * directly on a real button.
                 */

                if (
                    event.target.closest(
                        "button"
                    ) ||
                    event.target.closest(
                        "input"
                    )
                ) {

                    return;

                }

                fileInput.click();

            }
        );

    }


    /* ==============================
       CHOOSE MEDIA BUTTON
    ============================== */

    if (chooseMediaButton) {

        chooseMediaButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                if (!analysisInProgress) {

                    fileInput.click();

                }

            }
        );

    }


    /* ==============================
       FILE INPUT CHANGE
    ============================== */

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


    /* ==============================
       DRAG OVER
    ============================== */

    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        /* ==============================
           DRAG ENTER
        ============================== */

        dropZone.addEventListener(
            "dragenter",
            event => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        /* ==============================
           DRAG LEAVE
        ============================== */

        dropZone.addEventListener(
            "dragleave",
            event => {

                event.preventDefault();

                /*
                 * Only remove the class when
                 * actually leaving the drop zone.
                 */

                if (
                    event.target === dropZone
                ) {

                    dropZone.classList.remove(
                        "dragover"
                    );

                }

            }
        );


        /* ==============================
           DROP
        ============================== */

        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                event.stopPropagation();

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


    /* ==============================
       PROCESS SELECTED FILE
    ============================== */

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


        selectedFile = file;


        displaySelectedFile(
            file
        );


        resetAnalysis();


        /*
         * Enable analysis button.
         */

        if (scanButton) {

            scanButton.disabled = false;

            scanButton.style.opacity =
                "1";

            scanButton.style.cursor =
                "pointer";

        }


        console.log(
            "DeepShield AI: File selected:",
            file.name
        );

    }


    /* ==============================
       VALIDATE FILE
    ============================== */

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


    /* ==============================
       DISPLAY SELECTED FILE
    ============================== */

    function displaySelectedFile(file) {

        if (!fileSelected) {

            return;

        }


        const size =
            formatFileSize(
                file.size
            );


        const type =
            file.type ||
            "Unknown media type";


        fileSelected.style.display =
            "block";


        fileSelected.innerHTML = `
            ✓ <strong>${escapeHTML(file.name)}</strong>
            <br>
            <span style="opacity:0.75;">
                ${escapeHTML(type)} • ${size}
            </span>
        `;


        /*
         * Add selected state to upload area.
         */

        if (dropZone) {

            dropZone.classList.add(
                "file-selected"
            );

        }

    }


    /* ==============================
       START ANALYSIS
    ============================== */

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


                analysisInProgress = true;


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


    /* ==============================
       LOCAL ANALYSIS ENGINE
    ============================== */

    async function performLocalAnalysis(
        file
    ) {

        const metadata =
            await inspectMedia(
                file
            );


        const indicators =
            generateForensicIndicators(
                file,
                metadata
            );


        const score =
            calculateDemoScore(
                file,
                metadata,
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
                getMediaType(
                    file
                ),

            metadata,

            indicators,

            score,

            risk:
                getRiskLevel(
                    score
                ),

            generatedAt:
                new Date().toISOString(),

            engine:
                "DeepShield Local Forensics v0.1"

        };

    }


    /* ==============================
       MEDIA INSPECTION
    ============================== */

    function inspectMedia(file) {

        return new Promise(resolve => {

            const mediaType =
                getMediaType(
                    file
                );


            /* ==========================
               IMAGE
            ========================== */

            if (
                mediaType === "image"
            ) {

                const image =
                    new Image();


                const objectURL =
                    URL.createObjectURL(
                        file
                    );


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


            /* ==========================
               VIDEO
            ========================== */

            if (
                mediaType === "video"
            ) {

                const video =
                    document.createElement(
                        "video"
                    );


                const objectURL =
                    URL.createObjectURL(
                        file
                    );


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


    /* ==============================
       FORENSIC INDICATORS
    ============================== */

    function generateForensicIndicators(
        file,
        metadata
    ) {

        const indicators = [];


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


        if (
            metadata.width &&
            metadata.height
        ) {

            const pixels =
                metadata.width *
                metadata.height;


            indicators.push({

                name:
                    "Media Resolution",

                status:
                    pixels >= 100000
                        ? "Valid"
                        : "Low Resolution",

                severity:
                    pixels >= 100000
                        ? "low"
                        : "medium"

            });

        }


        if (
            metadata.aspectRatio
        ) {

            const unusualRatio =
                metadata.aspectRatio < 0.3 ||
                metadata.aspectRatio > 3.5;


            indicators.push({

                name:
                    "Aspect Ratio",

                status:
                    unusualRatio
                        ? "Unusual"
                        : "Normal",

                severity:
                    unusualRatio
                        ? "medium"
                        : "low"

            });

        }


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


        indicators.push({

            name:
                "File Size",

            status:
                file.size < 1024
                    ? "Very Small"
                    : "Normal",

            severity:
                file.size < 1024
                    ? "medium"
                    : "low"

        });


        return indicators;

    }


    /* ==============================
       DEMO SCORE
    ============================== */

    function calculateDemoScore(
        file,
        metadata,
        indicators
    ) {

        let score = 8;


        const suspicious =
            indicators.filter(
                indicator =>
                    indicator.severity === "medium" ||
                    indicator.severity === "high"
            );


        score +=
            suspicious.length * 7;


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            score += 2;

        }


        if (
            metadata.width &&
            metadata.height
        ) {

            if (
                metadata.width >= 1920 &&
                metadata.height >= 1080
            ) {

                score += 3;

            }

        }


        return Math.min(
            Math.max(
                score,
                1
            ),
            99
        );

    }


    /* ==============================
       RISK LEVEL
    ============================== */

    function getRiskLevel(score) {

        if (score >= 75) {

            return "HIGH";

        }


        if (score >= 45) {

            return "MEDIUM";

        }


        return "LOW";

    }


    /* ==============================
       DISPLAY RESULT
    ============================== */

    function displayAnalysisResult(
        report
    ) {

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


    /* ==============================
       UPDATE RISK LABEL
    ============================== */

    function updateRiskLabel(
        risk
    ) {

        const riskElement =
            analysisResult.querySelector(
                ".risk"
            );


        if (!riskElement) {

            return;

        }


        riskElement.textContent =
            `${risk} RISK`;

    }


    /* ==============================
       UPDATE INDICATORS
    ============================== */

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


    /* ==============================
       ANALYSIS DETAILS
    ============================== */

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


        details.innerHTML = `
            <strong>Forensic Information</strong>
            <br>
            File: ${escapeHTML(report.fileName)}
            <br>
            Type: ${escapeHTML(report.mediaType)}
            <br>
            Size: ${formatFileSize(report.fileSize)}
            <br>
            Resolution: ${dimensions}
            <br>
            Engine: ${escapeHTML(report.engine)}
        `;

    }


    /* ==============================
       RESET ANALYSIS
    ============================== */

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


    /* ==============================
       RESET FILE
    ============================== */

    function resetSelection() {

        selectedFile = null;


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
                false;

            scanButton.style.opacity =
                "1";

            scanButton.style.cursor =
                "pointer";

        }

    }


    /* ==============================
       BUTTON STATE
    ============================== */

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


    /* ==============================
       MESSAGE
    ============================== */

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


    /* ==============================
       MEDIA TYPE
    ============================== */

    function getMediaType(
        file
    ) {

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


    /* ==============================
       FILE EXTENSION
    ============================== */

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


    /* ==============================
       FILE SIZE
    ============================== */

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


    /* ==============================
       ASPECT RATIO
    ============================== */

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


    /* ==============================
       HTML ESCAPE
    ============================== */

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


    /* ==============================
       INITIAL STATE
    ============================== */

    resetSelection();


    /*
     * Make sure the hidden file input
     * accepts the supported formats.
     */

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
        "Upload interface ready."
    );

});
