/* PDF.JS WORKER */

if (typeof pdfjsLib !== "undefined") {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let imageFiles = [];
let imageRotations = [];

let pdfJpgFile = null;
let pdfJpgPages = [];
let selectedJpgPages = new Set();

let mergeFiles = [];

let splitFile = null;
let splitPages = [];
let selectedSplitPages = new Set();

let deleteFile = null;
let deletePages = [];
let selectedDeletePages = new Set();

let rearrangeFile = null;
let rearrangePages = [];


/* PDF EXTEND */

let extendPdfFile = null;
let extendItems = [];


/* =========================================================
   COMMON FUNCTIONS
   ========================================================= */

function setStatus(elementId, message) {

    const element =
        document.getElementById(elementId);

    if (element) {
        element.textContent = message;
    }
}


function downloadBlob(blob, filename) {

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(function() {

        URL.revokeObjectURL(url);

    }, 2000);
}


/* =========================================================
   DOWNLOAD FIRST -> TEST AD
   NOTE:
   This is only a test placeholder right now.
   Later, real web ad code can be integrated in the marked
   HTML ad slots after the site's advertising setup is ready.
   ========================================================= */

function requestDownload(blob, filename) {

    downloadBlob(blob, filename);

    setTimeout(function() {

        const modal =
            document.getElementById(
                "downloadModal"
            );

        if (modal) {
            modal.classList.remove("hidden");
        }

    }, 500);
}


/* CLOSE MODAL */

function closeDownloadModal() {

    const modal =
        document.getElementById(
            "downloadModal"
        );

    if (modal) {
        modal.classList.add("hidden");
    }
}


document.getElementById(
    "closeDownloadModal"
).addEventListener(
    "click",
    closeDownloadModal
);


document.getElementById(
    "closeAdBtn"
).addEventListener(
    "click",
    closeDownloadModal
);


document.querySelector(
    ".modal-overlay"
).addEventListener(
    "click",
    closeDownloadModal
);


/* =========================================================
   JPG TO PDF
   ========================================================= */

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const convertImageBtn =
    document.getElementById("convertImageBtn");


imageInput.addEventListener(
    "change",
    function() {

        imageFiles =
            Array.from(this.files);

        imageRotations =
            imageFiles.map(function() { return 0; });

        renderImagePreview();

    }
);


function renderImagePreview() {

    imagePreview.innerHTML = "";

    imageFiles.forEach(
        function(file, index) {

            const item =
                document.createElement("div");

            item.className =
                "preview-item";

            item.draggable = true;
            item.dataset.index = index;

            const img =
                document.createElement("img");

            img.src = URL.createObjectURL(file);
            applyRotationClass(img, imageRotations[index] || 0);

            const number =
                document.createElement("div");

            number.className = "preview-number";
            number.textContent = (index + 1) + ". " + file.name;

            item.appendChild(img);
            item.appendChild(number);
            item.appendChild(
                createRotationControls(function(delta) {
                    imageRotations[index] =
                        normalizeRotation((imageRotations[index] || 0) + delta);
                    renderImagePreview();
                })
            );

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "page-delete-btn";
            removeBtn.textContent = "🗑 Remove Page";
            removeBtn.title = "Remove this image page";
            removeBtn.addEventListener("click", function(event) {
                event.stopPropagation();
                imageFiles.splice(index, 1);
                imageRotations.splice(index, 1);
                renderImagePreview();
            });
            item.appendChild(removeBtn);

            addImageDragEvents(item);
            imagePreview.appendChild(item);
        }
    );

    convertImageBtn.disabled = imageFiles.length === 0;
}


function normalizeRotation(rotation) {
    return ((rotation % 360) + 360) % 360;
}


function applyRotationClass(img, rotation) {
    img.classList.remove(
        "rotated-90",
        "rotated-180",
        "rotated-270"
    );

    rotation = normalizeRotation(rotation);

    if (rotation === 90) img.classList.add("rotated-90");
    if (rotation === 180) img.classList.add("rotated-180");
    if (rotation === 270) img.classList.add("rotated-270");
}


function createRotationControls(onRotate) {
    const controls = document.createElement("div");
    controls.className = "rotation-controls";

    const left = document.createElement("button");
    left.type = "button";
    left.className = "rotate-btn";
    left.textContent = "↶ 90°";
    left.title = "Rotate left 90 degrees";
    left.addEventListener("click", function(event) {
        event.stopPropagation();
        onRotate(-90);
    });

    const right = document.createElement("button");
    right.type = "button";
    right.className = "rotate-btn";
    right.textContent = "↷ 90°";
    right.title = "Rotate right 90 degrees";
    right.addEventListener("click", function(event) {
        event.stopPropagation();
        onRotate(90);
    });

    controls.appendChild(left);
    controls.appendChild(right);
    return controls;
}


let draggedImageIndex = null;


function addImageDragEvents(item) {

    item.addEventListener(
        "dragstart",
        function() {

            draggedImageIndex =
                Number(this.dataset.index);

            this.classList.add(
                "dragging"
            );

        }
    );


    item.addEventListener(
        "dragend",
        function() {

            this.classList.remove(
                "dragging"
            );

        }
    );


    item.addEventListener(
        "dragover",
        function(event) {

            event.preventDefault();

            this.classList.add(
                "drag-over"
            );

        }
    );


    item.addEventListener(
        "dragleave",
        function() {

            this.classList.remove(
                "drag-over"
            );

        }
    );


    item.addEventListener(
        "drop",
        function(event) {

            event.preventDefault();

            const targetIndex =
                Number(this.dataset.index);


            if (
                draggedImageIndex === null ||
                draggedImageIndex === targetIndex
            ) {
                return;
            }


            const moved =
                imageFiles.splice(
                    draggedImageIndex,
                    1
                )[0];

            const movedRotation =
                imageRotations.splice(
                    draggedImageIndex,
                    1
                )[0];

            imageFiles.splice(
                targetIndex,
                0,
                moved
            );

            imageRotations.splice(
                targetIndex,
                0,
                movedRotation || 0
            );


            draggedImageIndex = null;

            renderImagePreview();

        }
    );
}


function getA4PageSize() {
    // A4 portrait in PDF points (210 x 297 mm)
    return [595.28, 841.89];
}


function drawImageOnPage(page, image, sourceWidth, sourceHeight) {

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    /*
       iLovePDF-style fit:
       - page stays A4
       - image keeps its exact aspect ratio
       - image is scaled as large as possible
       - no crop
       - no stretch
    */
    const imgWidth = sourceWidth || image.width;
    const imgHeight = sourceHeight || image.height;

    const scale = Math.min(
        pageWidth / imgWidth,
        pageHeight / imgHeight
    );

    const width = imgWidth * scale;
    const height = imgHeight * scale;

    page.drawImage(image, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width: width,
        height: height
    });
}



/* =========================================================
   IMAGE PROCESSING FOR A4
   ========================================================= */

/*
   The important part here is NOT stretching the picture.

   1. Keep every PDF page A4.
   2. Remove transparent outer margins from PNG files first.
      This is important for images such as logos exported with
      large transparent borders.
   3. Apply the requested rotation.
   4. Fit the real visible image into A4 as large as possible.
   5. Downsample large images before embedding to keep PDF size
      reasonable.
*/
const PDF_MAX_IMAGE_PX = 1700;
const PDF_REFERENCE_IMAGE_PX = 1400;
const PDF_JPEG_QUALITY = 0.72;


async function loadImageElement(file) {

    const objectUrl = URL.createObjectURL(file);

    try {

        const img = new Image();
        img.decoding = "async";
        img.src = objectUrl;

        await new Promise(function(resolve, reject) {

            img.onload = resolve;
            img.onerror = reject;

        });

        return img;

    } finally {

        URL.revokeObjectURL(objectUrl);

    }
}


/*
   Remove large, uniform outer margins from the SOURCE IMAGE itself.

   This is the missing part when a source file contains a white/black
   canvas around the real picture. Fitting that whole canvas to A4 makes
   the real picture look tiny even though the PDF fit math is correct.

   We only trim rows/columns that are overwhelmingly the same as the
   image's corner/background colour. Normal photo details are preserved.
*/
function trimUniformMargins(sourceCanvas) {

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    if (width < 20 || height < 20) {
        return sourceCanvas;
    }

    const ctx = sourceCanvas.getContext("2d", {
        willReadFrequently: true
    });

    if (!ctx) {
        return sourceCanvas;
    }

    const imageData = ctx.getImageData(
        0,
        0,
        width,
        height
    );

    const data = imageData.data;

    function pixel(x, y) {
        const i = (y * width + x) * 4;
        return [data[i], data[i + 1], data[i + 2]];
    }

    const corners = [
        pixel(0, 0),
        pixel(width - 1, 0),
        pixel(0, height - 1),
        pixel(width - 1, height - 1)
    ];

    const bg = [
        Math.round(corners.reduce((a, p) => a + p[0], 0) / 4),
        Math.round(corners.reduce((a, p) => a + p[1], 0) / 4),
        Math.round(corners.reduce((a, p) => a + p[2], 0) / 4)
    ];

    function isBackground(x, y) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
            Math.pow(r - bg[0], 2) +
            Math.pow(g - bg[1], 2) +
            Math.pow(b - bg[2], 2)
        );

        return distance <= 18;
    }

    function rowIsBackground(y) {
        let same = 0;
        const step = Math.max(1, Math.floor(width / 400));
        let total = 0;

        for (let x = 0; x < width; x += step) {
            total++;
            if (isBackground(x, y)) same++;
        }

        return total > 0 && same / total >= 0.985;
    }

    function columnIsBackground(x) {
        let same = 0;
        const step = Math.max(1, Math.floor(height / 400));
        let total = 0;

        for (let y = 0; y < height; y += step) {
            total++;
            if (isBackground(x, y)) same++;
        }

        return total > 0 && same / total >= 0.985;
    }

    let left = 0;
    let right = width - 1;
    let top = 0;
    let bottom = height - 1;

    /*
       Never remove the whole image. Also avoid turning a tiny graphic
       into an almost empty canvas because of a few similar edge rows.
    */
    while (top < bottom - 20 && rowIsBackground(top)) {
        top++;
    }

    while (bottom > top + 20 && rowIsBackground(bottom)) {
        bottom--;
    }

    while (left < right - 20 && columnIsBackground(left)) {
        left++;
    }

    while (right > left + 20 && columnIsBackground(right)) {
        right--;
    }

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    const changed =
        left > 0 ||
        top > 0 ||
        right < width - 1 ||
        bottom < height - 1;

    if (!changed || cropWidth < 50 || cropHeight < 50) {
        return sourceCanvas;
    }

    const cropped = document.createElement("canvas");
    cropped.width = cropWidth;
    cropped.height = cropHeight;

    const croppedCtx = cropped.getContext("2d");

    if (!croppedCtx) {
        return sourceCanvas;
    }

    croppedCtx.drawImage(
        sourceCanvas,
        left,
        top,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
    );

    return cropped;
}


/*
   Create a clean source canvas, auto-remove large uniform borders,
   then downsample only once for a smaller final PDF.
*/
async function prepareSourceCanvas(file) {

    const img = await loadImageElement(file);

    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;

    if (!sourceWidth || !sourceHeight) {
        throw new Error("Invalid image dimensions.");
    }

    const preScale = Math.min(
        1,
        PDF_MAX_IMAGE_PX / Math.max(sourceWidth, sourceHeight)
    );

    const scaledWidth = Math.max(
        1,
        Math.round(sourceWidth * preScale)
    );

    const scaledHeight = Math.max(
        1,
        Math.round(sourceHeight * preScale)
    );

    const canvas = document.createElement("canvas");
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not create canvas context.");
    }

    /* Flatten transparency onto white before trimming/embedding. */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    ctx.drawImage(
        img,
        0,
        0,
        scaledWidth,
        scaledHeight
    );

    const trimmed = trimUniformMargins(canvas);

    /*
       One final downsample if trimming changed the longest edge only
       slightly. This keeps memory/file size predictable.
    */
    const longest = Math.max(
        trimmed.width,
        trimmed.height
    );

    if (longest <= PDF_MAX_IMAGE_PX) {
        return trimmed;
    }

    const scale = PDF_MAX_IMAGE_PX / longest;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = Math.max(1, Math.round(trimmed.width * scale));
    finalCanvas.height = Math.max(1, Math.round(trimmed.height * scale));

    const finalCtx = finalCanvas.getContext("2d");

    if (!finalCtx) {
        return trimmed;
    }

    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = "high";

    finalCtx.drawImage(
        trimmed,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
    );

    return finalCanvas;
}


/*
   Rotate the already-trimmed source and return a white-backed
   JPEG-ready canvas.
*/
function rotateSourceCanvas(sourceCanvas, rotation) {

    const normalized =
        normalizeRotation(rotation);

    const quarterTurn =
        normalized === 90 ||
        normalized === 270;

    const outputWidth =
        quarterTurn
            ? sourceCanvas.height
            : sourceCanvas.width;

    const outputHeight =
        quarterTurn
            ? sourceCanvas.width
            : sourceCanvas.height;

    const outputCanvas =
        document.createElement("canvas");

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    const ctx =
        outputCanvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Could not create rotation canvas."
        );
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        outputWidth,
        outputHeight
    );

    ctx.save();

    ctx.translate(
        outputWidth / 2,
        outputHeight / 2
    );

    ctx.rotate(
        normalized * Math.PI / 180
    );

    ctx.drawImage(
        sourceCanvas,
        -sourceCanvas.width / 2,
        -sourceCanvas.height / 2
    );

    ctx.restore();

    return outputCanvas;
}


async function canvasToJpeg(canvas, quality) {

    return await new Promise(function(resolve) {

        canvas.toBlob(
            resolve,
            "image/jpeg",
            quality
        );

    });
}


async function createReferenceJpegSize(sourceCanvas) {

    const longest = Math.max(
        sourceCanvas.width,
        sourceCanvas.height
    );

    if (longest <= PDF_REFERENCE_IMAGE_PX) {
        const blob = await canvasToJpeg(
            sourceCanvas,
            PDF_JPEG_QUALITY
        );
        return blob ? blob.size : 0;
    }

    const scale = PDF_REFERENCE_IMAGE_PX / longest;

    const referenceCanvas = document.createElement("canvas");
    referenceCanvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
    referenceCanvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));

    const ctx = referenceCanvas.getContext("2d");
    if (!ctx) return 0;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, referenceCanvas.width, referenceCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
        sourceCanvas,
        0,
        0,
        referenceCanvas.width,
        referenceCanvas.height
    );

    const blob = await canvasToJpeg(
        referenceCanvas,
        PDF_JPEG_QUALITY
    );

    return blob ? blob.size : 0;
}


/*
   Keep the PDF image approximately the same byte size as the old
   1400px/72% version, while allowing a higher-resolution 1700px image.
   This improves text/detail clarity without intentionally increasing
   the downloaded PDF size.
*/
async function encodeAdaptiveJpeg(sourceCanvas) {

    const referenceSize =
        await createReferenceJpegSize(sourceCanvas);

    let blob = await canvasToJpeg(
        sourceCanvas,
        PDF_JPEG_QUALITY
    );

    if (!blob || !referenceSize || blob.size <= referenceSize) {
        return blob;
    }

    let low = 0.45;
    let high = PDF_JPEG_QUALITY;
    let best = null;

    for (let i = 0; i < 7; i++) {

        const quality = (low + high) / 2;
        const candidate = await canvasToJpeg(
            sourceCanvas,
            quality
        );

        if (!candidate) break;

        if (candidate.size <= referenceSize) {
            best = candidate;
            low = quality;
        } else {
            high = quality;
        }
    }

    return best || blob;
}


async function createRotatedImageForPdf(file, rotation) {

    const sourceCanvas =
        await prepareSourceCanvas(file);

    const rotatedCanvas =
        rotateSourceCanvas(
            sourceCanvas,
            rotation
        );

    const blob =
        await encodeAdaptiveJpeg(rotatedCanvas);

    if (!blob) {
        throw new Error(
            "Could not process image."
        );
    }

    return {
        blob: blob,
        width: rotatedCanvas.width,
        height: rotatedCanvas.height,
        mimeType: "image/jpeg"
    };
}


async function addRotatedImagePage(
    pdfDoc,
    file,
    rotation
) {

    const rotated =
        await createRotatedImageForPdf(
            file,
            rotation
        );

    const bytes =
        await rotated.blob.arrayBuffer();

    const image =
        await pdfDoc.embedJpg(bytes);

    /*
       Every image gets a real A4 page.
       drawImageOnPage() uses the ACTUAL processed dimensions
       so the image reaches the maximum possible size.
    */
    const page =
        pdfDoc.addPage(
            getA4PageSize()
        );

    drawImageOnPage(
        page,
        image,
        rotated.width,
        rotated.height
    );

    return page;
}


function addImagePage(pdfDoc, image, rotation) {

    const page =
        pdfDoc.addPage(
            getA4PageSize()
        );

    drawImageOnPage(
        page,
        image
    );

    return page;
}



/* IMAGE -> PDF */

convertImageBtn.addEventListener(
    "click",
    async function() {

        if (imageFiles.length === 0) {
            return;
        }


        try {

            setStatus(
                "imageStatus",
                "Creating PDF..."
            );

            convertImageBtn.disabled = true;


            const pdfDoc =
                await PDFLib.PDFDocument.create();


            for (
                const file of imageFiles
            ) {

                await addRotatedImagePage(
                    pdfDoc,
                    file,
                    imageRotations[imageFiles.indexOf(file)] || 0
                );

            }


            const pdfBytes =
                await pdfDoc.save({
                    useObjectStreams: true
                });


            const blob =
                new Blob(
                    [pdfBytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            requestDownload(
                blob,
                "PDFx_" +
                Date.now() +
                ".pdf"
            );


            setStatus(
                "imageStatus",
                "PDF created successfully."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "imageStatus",
                "Could not create PDF."
            );

        } finally {

            convertImageBtn.disabled =
                imageFiles.length === 0;

        }

    }
);


/* =========================================================
   PDF TO JPG
   ========================================================= */

const pdfJpgInput =
    document.getElementById("pdfJpgInput");

const pdfJpgPreview =
    document.getElementById("pdfJpgPreview");

const selectAllJpgBtn =
    document.getElementById("selectAllJpgBtn");

const clearJpgBtn =
    document.getElementById("clearJpgBtn");

const convertJpgBtn =
    document.getElementById("convertJpgBtn");


pdfJpgInput.addEventListener(
    "change",
    async function() {

        pdfJpgFile =
            this.files[0] || null;

        pdfJpgPages = [];

        selectedJpgPages.clear();

        pdfJpgPreview.innerHTML = "";


        if (!pdfJpgFile) {

            convertJpgBtn.disabled = true;

            return;

        }


        try {

            setStatus(
                "pdfJpgStatus",
                "Loading PDF..."
            );


            const arrayBuffer =
                await pdfJpgFile.arrayBuffer();


            const pdf =
                await pdfjsLib.getDocument({
                    data: arrayBuffer
                }).promise;


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                pdfJpgPages.push({
                    pageNumber:
                        pageNumber,

                    page:
                        page
                });


                await renderPdfPageThumbnail(
                    page,
                    pdfJpgPreview,
                    pageNumber,
                    selectedJpgPages,
                    updateJpgSelection
                );

            }


            selectAllJpgBtn.disabled = false;
            clearJpgBtn.disabled = false;
            convertJpgBtn.disabled = false;


            setStatus(
                "pdfJpgStatus",
                pdf.numPages +
                " pages loaded. Select the pages you want."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "pdfJpgStatus",
                "Could not load PDF."
            );

        }

    }
);


async function renderPdfPageThumbnail(
    page,
    container,
    pageNumber,
    selectionSet,
    callback
) {

    const item =
        document.createElement("div");

    item.className =
        "preview-item";


    const canvas =
        document.createElement("canvas");


    const viewport =
        page.getViewport({
            scale: 0.35
        });


    canvas.width =
        viewport.width;

    canvas.height =
        viewport.height;


    await page.render({

        canvasContext:
            canvas.getContext("2d"),

        viewport:
            viewport

    }).promise;


    const img =
        document.createElement("img");

    img.src =
        canvas.toDataURL(
            "image/jpeg",
            0.8
        );


    const number =
        document.createElement("div");

    number.className =
        "preview-number";

    number.textContent =
        "Page " +
        pageNumber;


    item.appendChild(img);
    item.appendChild(number);

    const deletePageBtn = document.createElement("button");
    deletePageBtn.type = "button";
    deletePageBtn.className = "page-delete-btn";
    deletePageBtn.textContent = "🗑 Delete";
    deletePageBtn.title = "Mark this page for deletion";
    deletePageBtn.addEventListener("click", function(event) {
        event.stopPropagation();

        if (selectionSet.has(pageNumber)) {
            selectionSet.delete(pageNumber);
            item.classList.remove("selected", "marked-delete");
            deletePageBtn.textContent = "🗑 Delete";
        } else {
            selectionSet.add(pageNumber);
            item.classList.add("selected", "marked-delete");
            deletePageBtn.textContent = "↩ Keep Page";
        }
        callback();
    });
    item.appendChild(deletePageBtn);


    item.addEventListener(
        "click",
        function() {

            if (
                selectionSet.has(
                    pageNumber
                )
            ) {

                selectionSet.delete(
                    pageNumber
                );

                item.classList.remove(
                    "selected",
                    "marked-delete"
                );
                deletePageBtn.textContent = "🗑 Delete";

            } else {

                selectionSet.add(
                    pageNumber
                );

                item.classList.add(
                    "selected",
                    "marked-delete"
                );
                deletePageBtn.textContent = "↩ Keep Page";

            }


            callback();

        }
    );


    container.appendChild(item);
}


function updateJpgSelection() {

    setStatus(
        "pdfJpgStatus",
        selectedJpgPages.size +
        " page(s) selected."
    );

}


selectAllJpgBtn.addEventListener(
    "click",
    function() {

        selectedJpgPages.clear();


        pdfJpgPages.forEach(
            function(item) {

                selectedJpgPages.add(
                    item.pageNumber
                );

            }
        );


        document.querySelectorAll(
            "#pdfJpgPreview .preview-item"
        ).forEach(
            function(item) {

                item.classList.add(
                    "selected"
                );

            }
        );


        updateJpgSelection();

    }
);


clearJpgBtn.addEventListener(
    "click",
    function() {

        selectedJpgPages.clear();


        document.querySelectorAll(
            "#pdfJpgPreview .preview-item"
        ).forEach(
            function(item) {

                item.classList.remove(
                    "selected"
                );

            }
        );


        updateJpgSelection();

    }
);


convertJpgBtn.addEventListener(
    "click",
    async function() {

        if (
            !pdfJpgFile ||
            selectedJpgPages.size === 0
        ) {
            return;
        }


        try {

            setStatus(
                "pdfJpgStatus",
                "Converting pages..."
            );


            const zip =
                new JSZip();


            for (
                const pageInfo of pdfJpgPages
            ) {

                if (
                    !selectedJpgPages.has(
                        pageInfo.pageNumber
                    )
                ) {
                    continue;
                }


                const viewport =
                    pageInfo.page.getViewport({
                        scale: 1.5
                    });


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    viewport.width;

                canvas.height =
                    viewport.height;


                await pageInfo.page.render({

                    canvasContext:
                        canvas.getContext("2d"),

                    viewport:
                        viewport

                }).promise;


                const blob =
                    await new Promise(
                        function(resolve) {

                            canvas.toBlob(
                                resolve,
                                "image/jpeg",
                                0.92
                            );

                        }
                    );


                zip.file(
                    "page-" +
                    pageInfo.pageNumber +
                    ".jpg",
                    blob
                );

            }


            const zipBlob =
                await zip.generateAsync({
                    type: "blob"
                });


            requestDownload(
                zipBlob,
                "PDFx_JPG_" +
                Date.now() +
                ".zip"
            );


            setStatus(
                "pdfJpgStatus",
                "JPG files created successfully."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "pdfJpgStatus",
                "Could not convert PDF."
            );

        }

    }
);


/* =========================================================
   MERGE PDF
   ========================================================= */

const mergeInput =
    document.getElementById("mergeInput");

const mergePreview =
    document.getElementById("mergePreview");

const mergeBtn =
    document.getElementById("mergeBtn");


mergeInput.addEventListener(
    "change",
    async function() {

        mergeFiles =
            Array.from(this.files);

        mergePreview.innerHTML = "";


        if (mergeFiles.length === 0) {

            mergeBtn.disabled = true;

            return;

        }


        for (
            const file of mergeFiles
        ) {

            let pageCount = "?";


            try {

                const bytes =
                    await file.arrayBuffer();

                const pdf =
                    await PDFLib.PDFDocument.load(
                        bytes
                    );

                pageCount =
                    pdf.getPageCount();

            } catch (error) {

                console.error(error);

            }


            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "file-row";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "file-name";

            name.textContent =
                file.name;


            const pages =
                document.createElement(
                    "div"
                );

            pages.className =
                "file-pages";

            pages.textContent =
                pageCount +
                " pages";


            row.appendChild(name);
            row.appendChild(pages);

            mergePreview.appendChild(row);

        }


        mergeBtn.disabled =
            mergeFiles.length < 2;

    }
);


mergeBtn.addEventListener(
    "click",
    async function() {

        if (mergeFiles.length < 2) {
            return;
        }


        try {

            setStatus(
                "mergeStatus",
                "Merging PDFs..."
            );


            const mergedPdf =
                await PDFLib.PDFDocument.create();


            for (
                const file of mergeFiles
            ) {

                const bytes =
                    await file.arrayBuffer();


                const pdf =
                    await PDFLib.PDFDocument.load(
                        bytes
                    );


                const copiedPages =
                    await mergedPdf.copyPages(
                        pdf,
                        pdf.getPageIndices()
                    );


                copiedPages.forEach(
                    function(page) {

                        mergedPdf.addPage(
                            page
                        );

                    }
                );

            }


            const pdfBytes =
                await mergedPdf.save();


            const blob =
                new Blob(
                    [pdfBytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            requestDownload(
                blob,
                "PDFx_Merged_" +
                Date.now() +
                ".pdf"
            );


            setStatus(
                "mergeStatus",
                "PDFs merged successfully."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "mergeStatus",
                "Could not merge PDFs."
            );

        }

    }
);


/* =========================================================
   SPLIT PDF
   ========================================================= */

const splitInput =
    document.getElementById("splitInput");

const splitPreview =
    document.getElementById("splitPreview");

const splitBtn =
    document.getElementById("splitBtn");


splitInput.addEventListener(
    "change",
    async function() {

        splitFile =
            this.files[0] || null;

        splitPages = [];

        selectedSplitPages.clear();

        splitPreview.innerHTML = "";


        if (!splitFile) {

            splitBtn.disabled = true;

            return;

        }


        try {

            const bytes =
                await splitFile.arrayBuffer();


            const pdf =
                await pdfjsLib.getDocument({
                    data: bytes
                }).promise;


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                splitPages.push({
                    pageNumber:
                        pageNumber,

                    page:
                        page
                });


                await renderPdfPageThumbnail(
                    page,
                    splitPreview,
                    pageNumber,
                    selectedSplitPages,
                    function() {

                        setStatus(
                            "splitStatus",
                            selectedSplitPages.size +
                            " page(s) selected."
                        );

                    }
                );

            }


            splitBtn.disabled = false;


            setStatus(
                "splitStatus",
                "Select the pages you want."
            );


        } catch (error) {

            console.error(error);

        }

    }
);


splitBtn.addEventListener(
    "click",
    async function() {

        if (
            !splitFile ||
            selectedSplitPages.size === 0
        ) {
            return;
        }


        try {

            const sourceBytes =
                await splitFile.arrayBuffer();


            const sourcePdf =
                await PDFLib.PDFDocument.load(
                    sourceBytes
                );


            const newPdf =
                await PDFLib.PDFDocument.create();


            const indexes =
                Array.from(
                    selectedSplitPages
                )
                .sort(
                    function(a, b) {
                        return a - b;
                    }
                )
                .map(
                    function(page) {
                        return page - 1;
                    }
                );


            const copied =
                await newPdf.copyPages(
                    sourcePdf,
                    indexes
                );


            copied.forEach(
                function(page, index) {
                    const info = rearrangePages[index];
                    const originalRotation = page.getRotation().angle || 0;
                    const extraRotation = info.rotation || 0;
                    page.setRotation(
                        PDFLib.degrees(
                            normalizeRotation(
                                originalRotation + extraRotation
                            )
                        )
                    );
                    newPdf.addPage(page);
                }
            );


            const bytes =
                await newPdf.save({
                    useObjectStreams: true
                });


            const blob =
                new Blob(
                    [bytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            requestDownload(
                blob,
                "PDFx_Split_" +
                Date.now() +
                ".pdf"
            );


        } catch (error) {

            console.error(error);

        }

    }
);


/* =========================================================
   DELETE PDF PAGES
   ========================================================= */

const deleteInput =
    document.getElementById("deleteInput");

const deletePreview =
    document.getElementById("deletePreview");

const deleteBtn =
    document.getElementById("deleteBtn");


deleteInput.addEventListener(
    "change",
    async function() {

        deleteFile =
            this.files[0] || null;

        selectedDeletePages.clear();

        deletePreview.innerHTML = "";


        if (!deleteFile) {

            deleteBtn.disabled = true;

            return;

        }


        try {

            const bytes =
                await deleteFile.arrayBuffer();


            const pdf =
                await pdfjsLib.getDocument({
                    data: bytes
                }).promise;


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                deletePages.push({
                    pageNumber:
                        pageNumber,

                    page:
                        page
                });


                await renderPdfPageThumbnail(
                    page,
                    deletePreview,
                    pageNumber,
                    selectedDeletePages,
                    function() {

                        setStatus(
                            "deleteStatus",
                            selectedDeletePages.size +
                            " page(s) selected."
                        );

                    }
                );

            }


            deleteBtn.disabled = false;


        } catch (error) {

            console.error(error);

        }

    }
);


deleteBtn.addEventListener(
    "click",
    async function() {

        if (!deleteFile) {
            return;
        }


        try {

            const sourceBytes =
                await deleteFile.arrayBuffer();


            const sourcePdf =
                await PDFLib.PDFDocument.load(
                    sourceBytes
                );


            const total =
                sourcePdf.getPageCount();


            if (
                selectedDeletePages.size >=
                total
            ) {

                setStatus(
                    "deleteStatus",
                    "You cannot delete all pages."
                );

                return;

            }


            const keepIndexes = [];


            for (
                let i = 0;
                i < total;
                i++
            ) {

                if (
                    !selectedDeletePages.has(
                        i + 1
                    )
                ) {

                    keepIndexes.push(i);

                }

            }


            const newPdf =
                await PDFLib.PDFDocument.create();


            const copied =
                await newPdf.copyPages(
                    sourcePdf,
                    keepIndexes
                );


            copied.forEach(
                function(page) {
                    newPdf.addPage(page);
                }
            );


            const bytes =
                await newPdf.save({
                    useObjectStreams: true
                });


            const blob =
                new Blob(
                    [bytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            requestDownload(
                blob,
                "PDFx_Deleted_" +
                Date.now() +
                ".pdf"
            );


        } catch (error) {

            console.error(error);

        }

    }
);


/* =========================================================
   REARRANGE PDF
   ========================================================= */

const rearrangeInput =
    document.getElementById("rearrangeInput");

const rearrangePreview =
    document.getElementById("rearrangePreview");

const rearrangeBtn =
    document.getElementById("rearrangeBtn");


rearrangeInput.addEventListener(
    "change",
    async function() {

        rearrangeFile =
            this.files[0] || null;

        rearrangePages = [];

        rearrangePreview.innerHTML = "";


        if (!rearrangeFile) {

            rearrangeBtn.disabled = true;

            return;

        }


        try {

            const bytes =
                await rearrangeFile.arrayBuffer();


            const pdf =
                await pdfjsLib.getDocument({
                    data: bytes
                }).promise;


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                const viewport =
                    page.getViewport({
                        scale: 0.35
                    });


                canvas.width =
                    viewport.width;

                canvas.height =
                    viewport.height;


                await page.render({

                    canvasContext:
                        canvas.getContext(
                            "2d"
                        ),

                    viewport:
                        viewport

                }).promise;


                rearrangePages.push({

                    pageNumber:
                        pageNumber,

                    rotation: 0,

                    dataUrl:
                        canvas.toDataURL(
                            "image/jpeg",
                            0.8
                        )

                });

            }


            renderRearrangePreview();

            rearrangeBtn.disabled =
                false;


        } catch (error) {

            console.error(error);

        }

    }
);


let draggedRearrangeIndex = null;


function renderRearrangePreview() {

    rearrangePreview.innerHTML = "";


    rearrangePages.forEach(
        function(pageInfo, index) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "preview-item";

            item.draggable = true;

            item.dataset.index =
                index;


            const img =
                document.createElement(
                    "img"
                );

            img.src =
                pageInfo.dataUrl;

            applyRotationClass(
                img,
                pageInfo.rotation || 0
            );


            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "preview-number";

            number.textContent =
                "Page " +
                pageInfo.pageNumber;


            item.appendChild(img);
            item.appendChild(number);

            item.appendChild(
                createRotationControls(function(delta) {
                    pageInfo.rotation =
                        normalizeRotation((pageInfo.rotation || 0) + delta);
                    renderRearrangePreview();
                })
            );

            const removeRearrangeBtn = document.createElement("button");
            removeRearrangeBtn.type = "button";
            removeRearrangeBtn.className = "page-delete-btn";
            removeRearrangeBtn.textContent = "🗑 Remove Page";
            removeRearrangeBtn.title = "Remove this page from the output PDF";
            removeRearrangeBtn.addEventListener("click", function(event) {
                event.stopPropagation();
                rearrangePages.splice(index, 1);
                renderRearrangePreview();
                rearrangeBtn.disabled = rearrangePages.length === 0;
            });
            item.appendChild(removeRearrangeBtn);

            item.addEventListener(
                "dragstart",
                function() {

                    draggedRearrangeIndex =
                        Number(
                            this.dataset.index
                        );

                    this.classList.add(
                        "dragging"
                    );

                }
            );


            item.addEventListener(
                "dragend",
                function() {

                    this.classList.remove(
                        "dragging"
                    );

                }
            );


            item.addEventListener(
                "dragover",
                function(event) {

                    event.preventDefault();

                    this.classList.add(
                        "drag-over"
                    );

                }
            );


            item.addEventListener(
                "dragleave",
                function() {

                    this.classList.remove(
                        "drag-over"
                    );

                }
            );


            item.addEventListener(
                "drop",
                function(event) {

                    event.preventDefault();


                    const targetIndex =
                        Number(
                            this.dataset.index
                        );


                    if (
                        draggedRearrangeIndex === null ||
                        draggedRearrangeIndex === targetIndex
                    ) {
                        return;
                    }


                    const moved =
                        rearrangePages.splice(
                            draggedRearrangeIndex,
                            1
                        )[0];


                    rearrangePages.splice(
                        targetIndex,
                        0,
                        moved
                    );


                    draggedRearrangeIndex =
                        null;


                    renderRearrangePreview();

                }
            );


            rearrangePreview.appendChild(
                item
            );

        }
    );

}


rearrangeBtn.addEventListener(
    "click",
    async function() {

        if (
            !rearrangeFile ||
            rearrangePages.length === 0
        ) {
            return;
        }


        try {

            const sourceBytes =
                await rearrangeFile.arrayBuffer();


            const sourcePdf =
                await PDFLib.PDFDocument.load(
                    sourceBytes
                );


            const newPdf =
                await PDFLib.PDFDocument.create();


            const indexes =
                rearrangePages.map(
                    function(page) {
                        return page.pageNumber - 1;
                    }
                );


            const copied =
                await newPdf.copyPages(
                    sourcePdf,
                    indexes
                );


            copied.forEach(
                function(page) {
                    newPdf.addPage(page);
                }
            );


            const bytes =
                await newPdf.save({
                    useObjectStreams: true
                });


            const blob =
                new Blob(
                    [bytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            requestDownload(
                blob,
                "PDFx_Rearranged_" +
                Date.now() +
                ".pdf"
            );


        } catch (error) {

            console.error(error);

        }

    }
);


/* =========================================================
   PDF EXTEND
   ========================================================= */

const extendPdfInput =
    document.getElementById(
        "extendPdfInput"
    );

const extendImageInput =
    document.getElementById(
        "extendImageInput"
    );

const extendAddBtn =
    document.getElementById(
        "extendAddBtn"
    );

const extendPreview =
    document.getElementById(
        "extendPreview"
    );

const extendBtn =
    document.getElementById(
        "extendBtn"
    );


/*
   extendItems example:

   [
       {
           type: "pdf",
           pageNumber: 1
       },

       {
           type: "image",
           file: imageFile
       },

       {
           type: "pdf",
           pageNumber: 2
       }
   ]
*/


/* SELECT EXISTING PDF */

extendPdfInput.addEventListener(
    "change",
    async function() {

        extendPdfFile =
            this.files[0] || null;

        extendItems = [];

        extendPreview.innerHTML = "";


        if (!extendPdfFile) {

            extendAddBtn.disabled = true;
            extendBtn.disabled = true;

            return;

        }


        try {

            setStatus(
                "extendStatus",
                "Loading PDF..."
            );


            const bytes =
                await extendPdfFile.arrayBuffer();


            const pdf =
                await pdfjsLib.getDocument({
                    data: bytes
                }).promise;


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                extendItems.push({

                    type:
                        "pdf",

                    pageNumber:
                        pageNumber,

                    rotation: 0

                });

            }


            await renderExtendPreview();


            extendAddBtn.disabled = false;

            extendBtn.disabled = false;


            setStatus(
                "extendStatus",
                pdf.numPages +
                " page(s) loaded. Add new pages if needed."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "extendStatus",
                "Could not load PDF."
            );

        }

    }
);


/* OPEN IMAGE SELECTOR */

extendAddBtn.addEventListener(
    "click",
    function() {

        if (!extendPdfFile) {
            return;
        }

        extendImageInput.click();

    }
);


/* ADD NEW IMAGE PAGES */

extendImageInput.addEventListener(
    "change",
    async function() {

        const files =
            Array.from(this.files);


        if (files.length === 0) {
            return;
        }


        if (!extendPdfFile) {

            setStatus(
                "extendStatus",
                "Please select an existing PDF first."
            );

            return;

        }


        files.forEach(
            function(file) {

                extendItems.push({

                    type:
                        "image",

                    file:
                        file,

                    rotation: 0

                });

            }
        );


        await renderExtendPreview();


        setStatus(
            "extendStatus",
            files.length +
            " new page(s) added."
        );


        this.value = "";

    }
);


/* =========================================================
   EXTEND PREVIEW
   ========================================================= */

let draggedExtendIndex = null;


async function renderExtendPreview() {

    extendPreview.innerHTML = "";


    /*
       Load original PDF only once.
    */

    let pdf = null;


    const hasPdfPages =
        extendItems.some(
            function(item) {
                return item.type === "pdf";
            }
        );


    if (hasPdfPages) {

        try {

            const bytes =
                await extendPdfFile.arrayBuffer();


            pdf =
                await pdfjsLib.getDocument({
                    data: bytes
                }).promise;

        } catch (error) {

            console.error(error);

        }

    }


    for (
        let index = 0;
        index < extendItems.length;
        index++
    ) {

        const data =
            extendItems[index];


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "preview-item";

        item.draggable = true;

        item.dataset.index =
            index;


        const img =
            document.createElement(
                "img"
            );


        const number =
            document.createElement(
                "div"
            );


        number.className =
            "preview-number";


        /* EXISTING PDF PAGE */

        if (
            data.type === "pdf"
        ) {

            if (pdf) {

                try {

                    const page =
                        await pdf.getPage(
                            data.pageNumber
                        );


                    const viewport =
                        page.getViewport({
                            scale: 0.35
                        });


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        viewport.width;

                    canvas.height =
                        viewport.height;


                    await page.render({

                        canvasContext:
                            canvas.getContext(
                                "2d"
                            ),

                        viewport:
                            viewport

                    }).promise;


                    img.src =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.8
                        );


                } catch (error) {

                    console.error(error);

                }

            }


            number.textContent =
                (index + 1) +
                ". PDF Page " +
                data.pageNumber;

        }


        /* NEW IMAGE PAGE */

        else {

            img.src =
                URL.createObjectURL(
                    data.file
                );


            number.textContent =
                (index + 1) +
                ". New Page";

        }


        applyRotationClass(
            img,
            data.rotation || 0
        );

        item.appendChild(img);
        item.appendChild(number);

        item.appendChild(
            createRotationControls(function(delta) {
                data.rotation =
                    normalizeRotation((data.rotation || 0) + delta);
                renderExtendPreview();
            })
        );


        /* DRAG START */

        item.addEventListener(
            "dragstart",
            function() {

                draggedExtendIndex =
                    Number(
                        this.dataset.index
                    );

                this.classList.add(
                    "dragging"
                );

            }
        );


        /* DRAG END */

        item.addEventListener(
            "dragend",
            function() {

                this.classList.remove(
                    "dragging"
                );

                this.classList.remove(
                    "drag-over"
                );

            }
        );


        /* DRAG OVER */

        item.addEventListener(
            "dragover",
            function(event) {

                event.preventDefault();

                this.classList.add(
                    "drag-over"
                );

            }
        );


        /* DRAG LEAVE */

        item.addEventListener(
            "dragleave",
            function() {

                this.classList.remove(
                    "drag-over"
                );

            }
        );


        /* DROP */

        item.addEventListener(
            "drop",
            async function(event) {

                event.preventDefault();

                this.classList.remove(
                    "drag-over"
                );


                const targetIndex =
                    Number(
                        this.dataset.index
                    );


                if (
                    draggedExtendIndex === null ||
                    draggedExtendIndex === targetIndex
                ) {

                    return;

                }


                const moved =
                    extendItems.splice(
                        draggedExtendIndex,
                        1
                    )[0];


                extendItems.splice(
                    targetIndex,
                    0,
                    moved
                );


                draggedExtendIndex =
                    null;


                await renderExtendPreview();

            }
        );


        extendPreview.appendChild(
            item
        );

    }

}


/* =========================================================
   CREATE EXTENDED PDF
   ========================================================= */

extendBtn.addEventListener(
    "click",
    async function() {

        if (
            !extendPdfFile ||
            extendItems.length === 0
        ) {
            return;
        }


        try {

            setStatus(
                "extendStatus",
                "Creating extended PDF..."
            );


            extendBtn.disabled = true;


            /*
               Load original PDF
            */

            const sourceBytes =
                await extendPdfFile.arrayBuffer();


            const sourcePdf =
                await PDFLib.PDFDocument.load(
                    sourceBytes
                );


            /*
               Create new PDF
            */

            const newPdf =
                await PDFLib.PDFDocument.create();


            /*
               Follow exactly the order
               shown in preview.
            */

            for (
                const item of extendItems
            ) {


                /* EXISTING PDF PAGE */

                if (
                    item.type === "pdf"
                ) {

                    const copied =
                        await newPdf.copyPages(
                            sourcePdf,
                            [
                                item.pageNumber - 1
                            ]
                        );


                    if (
                        copied.length > 0
                    ) {

                        const copiedPage = copied[0];
                        const originalRotation =
                            copiedPage.getRotation().angle || 0;
                        const extraRotation =
                            item.rotation || 0;

                        copiedPage.setRotation(
                            PDFLib.degrees(
                                normalizeRotation(
                                    originalRotation + extraRotation
                                )
                            )
                        );

                        newPdf.addPage(
                            copiedPage
                        );

                    }

                }


                /* NEW IMAGE PAGE */

                else if (
                    item.type === "image"
                ) {

                    const file =
                        item.file;


                    const bytes =
                        await file.arrayBuffer();


                    await addRotatedImagePage(
                        newPdf,
                        file,
                        item.rotation || 0
                    );
                    continue;

                }

            }


            /*
               Save final PDF
            */

            const pdfBytes =
                await newPdf.save({
                    useObjectStreams: true
                });


            const blob =
                new Blob(
                    [pdfBytes],
                    {
                        type:
                            "application/pdf"
                    }
                );


            /*
               Download first.
               Advertisement appears after download.
            */

            requestDownload(
                blob,
                "PDFx_Extended_" +
                Date.now() +
                ".pdf"
            );


            setStatus(
                "extendStatus",
                "PDF extended successfully."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "extendStatus",
                "Could not extend PDF."
            );

        } finally {

            extendBtn.disabled = false;

        }

    }
);
