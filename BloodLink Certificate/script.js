/*=========================================================
    BLOODLINK CERTIFICATE
=========================================================*/


const certificate = {

    name: "Pranav Krishna",

    bloodGroup: "O+",

    hospital: "AJ Hospital, Mangalore",

    date: "08 July 2026",

    certificateId: "BL-2026-001254"

};



function loadCertificate(data){

    document.getElementById("donorName").textContent = data.name;

    document.getElementById("bloodGroup").textContent = data.bloodGroup;

    document.getElementById("hospital").textContent = data.hospital;

    document.getElementById("donationDate").textContent = data.date;

    document.getElementById("certificateID").textContent = data.certificateId;

}



loadCertificate(certificate);



/*=========================================================
      PUBLIC FUNCTION
=========================================================*/

function setCertificate(data){

    loadCertificate(data);

}
async function downloadCertificate() {

    const { jsPDF } = window.jspdf;

    const certificate = document.querySelector(".certificate");
    const page = document.querySelector(".page");

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

    const canvas = await html2canvas(certificate, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff"
    });

    // Restore responsive scaling
    page.style.transform = oldTransform;
    page.style.transformOrigin = oldOrigin;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress:true
    });

    pdf.addImage(
        canvas.toDataURL("image/png",0.95),
        "PNG",
        0,
        0,
        297,
        210
    );

    pdf.save("BloodLink-Certificate.pdf");
}