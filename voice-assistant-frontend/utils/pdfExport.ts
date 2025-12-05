/**
 * PDF export utility functions
 * Handles all PDF generation logic separated from UI components
 */

const PDF_MARGIN_MM = 10;
const IMAGE_LOAD_TIMEOUT_MS = 5000;
const RENDER_DELAY_MS = 1500;
const TYPING_SPEED_MS = 30;

/**
 * Waits for all images in the element to load
 * Sets crossOrigin for external images to avoid CORS issues
 */
export async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  const imagePromises: Promise<void>[] = [];

  Array.from(images as NodeListOf<HTMLImageElement>).forEach((img) => {
    if (img.complete && img.naturalHeight !== 0) {
      return; // Already loaded
    }

    // Set crossOrigin for external images
    if (img.src && (img.src.startsWith("http://") || img.src.startsWith("https://"))) {
      img.crossOrigin = "anonymous";
    }

    const promise = new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), IMAGE_LOAD_TIMEOUT_MS);

      const loadHandler = () => {
        clearTimeout(timeout);
        img.removeEventListener("load", loadHandler);
        img.removeEventListener("error", errorHandler);
        resolve();
      };

      const errorHandler = () => {
        clearTimeout(timeout);
        img.removeEventListener("load", loadHandler);
        img.removeEventListener("error", errorHandler);
        console.warn(`Failed to load image: ${img.src}`);
        resolve(); // Continue even if image fails
      };

      img.addEventListener("load", loadHandler);
      img.addEventListener("error", errorHandler);

      // Trigger load if not already loading
      if (!img.complete) {
        const src = img.src;
        img.src = "";
        img.src = src;
      }
    });

    imagePromises.push(promise);
  });

  await Promise.all(imagePromises);
}

/**
 * Configures cloned document for PDF export
 * Ensures images are visible and layout is correct
 */
export function configureClonedDocumentForPDF(clonedDoc: Document): void {
  const clonedImages = clonedDoc.querySelectorAll("img");
  clonedImages.forEach((img: HTMLImageElement) => {
    img.style.opacity = "1";
    img.style.visibility = "visible";
    img.style.display = "block";
    if (img.src && (img.src.startsWith("http://") || img.src.startsWith("https://"))) {
      img.crossOrigin = "anonymous";
    }
  });

  const contentDiv = clonedDoc.querySelector(".letter-content-for-pdf");
  if (contentDiv) {
    (contentDiv as HTMLElement).style.display = "flex";
    (contentDiv as HTMLElement).style.flexDirection = "column";
  }
}

/**
 * Calculates PDF dimensions maintaining aspect ratio
 */
export function calculatePdfDimensions(
  canvasWidth: number,
  canvasHeight: number,
  pdfWidth: number,
  pdfHeight: number
): { width: number; height: number; x: number; y: number } {
  const maxWidth = pdfWidth - PDF_MARGIN_MM * 2;
  const maxHeight = pdfHeight - PDF_MARGIN_MM * 2;

  const ratio = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
  const scaledWidth = canvasWidth * ratio;
  const scaledHeight = canvasHeight * ratio;

  return {
    width: scaledWidth,
    height: scaledHeight,
    x: (pdfWidth - scaledWidth) / 2,
    y: PDF_MARGIN_MM,
  };
}

/**
 * Exports element content to PDF
 * Handles multi-page content splitting automatically
 */
export async function exportElementToPDF(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  await waitForImagesToLoad(element);
  await new Promise((resolve) => setTimeout(resolve, RENDER_DELAY_MS));

  // Force layout recalculation
  element.offsetHeight;

  const canvas = await html2canvas(element, {
    backgroundColor: "#FFFFFF",
    scale: 2,
    logging: false,
    useCORS: true,
    allowTaint: true,
    imageTimeout: 20000,
    removeContainer: false,
    windowWidth: element.scrollWidth || 400,
    windowHeight: element.scrollHeight || 800,
    onclone: configureClonedDocumentForPDF,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const { width, height, x, y } = calculatePdfDimensions(
    canvas.width,
    canvas.height,
    pdfWidth,
    pdfHeight
  );

  const maxHeight = pdfHeight - PDF_MARGIN_MM * 2;

  if (height <= maxHeight) {
    pdf.addImage(imgData, "PNG", x, y, width, height, undefined, "FAST");
  } else {
    // Split across multiple pages
    let remainingHeight = height;
    let sourceY = 0;
    let pageNum = 1;

    while (remainingHeight > 0) {
      if (pageNum > 1) {
        pdf.addPage();
      }

      const pageHeight = Math.min(remainingHeight, maxHeight);
      const sourceHeight = (pageHeight / height) * canvas.height;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const pageCtx = pageCanvas.getContext("2d");

      if (pageCtx) {
        pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
        const pageImgScaledHeight = (sourceHeight / canvas.height) * height;

        pdf.addImage(pageImgData, "PNG", x, PDF_MARGIN_MM, width, pageImgScaledHeight, undefined, "FAST");
      }

      remainingHeight -= maxHeight;
      sourceY += sourceHeight;
      pageNum++;
    }
  }

  pdf.save(fileName);
}

/**
 * Calculates estimated time for typing animation to complete
 */
export function calculateTypingTime(remainingChars: number): number {
  return remainingChars * TYPING_SPEED_MS + 2000; // typing speed + buffer
}

