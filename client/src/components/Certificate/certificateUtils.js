import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const downloadCertificate = async (certificateRef, pageRef, donorName) => {
    if (!certificateRef.current || !pageRef.current) return;

    const certificate = certificateRef.current;
    const page = pageRef.current;

    // Save current transform
    const oldTransform = page.style.transform;
    const oldOrigin = page.style.transformOrigin;

    // Remove responsive scaling
    page.style.transform = "scale(1)";
    page.style.transformOrigin = "top left";

    // Wait for browser to update layout
    await new Promise(resolve => setTimeout(resolve, 100));

    // Wait for all images
    const images = certificate.querySelectorAll("img");
    await Promise.all(
        [...images].map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        })
    );

    // Fix html2canvas cropping issue by preventing viewport clipping
    const wrapper = certificate.closest('.bloodlink-certificate-wrapper');
    let oldStyles = {};
    if (wrapper) {
        oldStyles = {
            scrollTop: wrapper.scrollTop,
            overflow: wrapper.style.overflow,
            position: wrapper.style.position,
            height: wrapper.style.height,
            display: wrapper.style.display
        };
        wrapper.scrollTop = 0;
        wrapper.style.overflow = 'visible';
        wrapper.style.position = 'absolute';
        wrapper.style.height = 'max-content';
        wrapper.style.display = 'block'; // Disable flex centering to snap to integer coordinates
    }

    // Temporarily remove box-shadow to prevent html2canvas from adding a white margin
    const oldShadow = certificate.style.boxShadow;
    certificate.style.boxShadow = 'none';

    const canvas = await html2canvas(certificate, {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        backgroundColor: "rgb(255, 253, 242)"
    });

    certificate.style.boxShadow = oldShadow;

    if (wrapper) {
        wrapper.style.display = oldStyles.display;
        wrapper.style.overflow = oldStyles.overflow;
        wrapper.style.position = oldStyles.position;
        wrapper.style.height = oldStyles.height;
        wrapper.scrollTop = oldStyles.scrollTop;
    }

    // Restore responsive scaling
    page.style.transform = oldTransform;
    page.style.transformOrigin = oldOrigin;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true
    });

    pdf.addImage(
        canvas.toDataURL("image/png", 0.95),
        "PNG",
        0,
        0,
        297,
        210
    );

    const fileName = donorName ? `${donorName.replace(/\s+/g, '_')}_BloodLink_Certificate.pdf` : "BloodLink_Certificate.pdf";
    pdf.save(fileName);
};
