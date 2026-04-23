/**
 * Forces a file download with a specific filename.
 * Handles Cloudinary URLs by adding fl_attachment.
 * 
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The desired filename
 */
export const forceDownload = (url, filename) => {
  if (!url) return;

  let finalUrl = url;

  // Handle Cloudinary URLs to force attachment and correct filename
  if (url.includes('cloudinary.com')) {
    // Insert fl_attachment into the URL after /upload/
    if (url.includes('/upload/')) {
      const parts = url.split('/upload/');
      // We also sanitize the filename for Cloudinary header
      const safeName = (filename || 'document').replace(/[^a-zA-Z0-9.-]/g, '_');
      finalUrl = `${parts[0]}/upload/fl_attachment:${safeName}/${parts[1]}`;
    }
  }

  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = finalUrl;
  link.setAttribute('download', filename || 'file');
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
