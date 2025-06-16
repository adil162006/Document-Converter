const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const convertBtn = document.getElementById('convertBtn');
const progressBar = document.getElementById('progressBar');
const progress = progressBar.querySelector('.progress');
const themeToggle = document.getElementById('themeToggle');
const previewContainer = document.getElementById('previewContainer');
const preview = document.getElementById('preview');
const toast = document.getElementById('toast');
const outputFormat = document.getElementById('outputFormat');

let files = [];
let currentScale = 1;
let selectedPageSize = 'auto';

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// Quality Settings
document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScale = parseFloat(btn.dataset.scale);
    });
});

// Page Size Settings
document.getElementById('pageSize').addEventListener('change', (e) => {
    selectedPageSize = e.target.value;
});

// Drag and Drop
const dropZone = document.querySelector('.file-label');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.transform = 'scale(1.02)';
    dropZone.style.borderColor = 'var(--primary)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.transform = 'scale(1)';
    dropZone.style.borderColor = 'var(--border)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.transform = 'scale(1)';
    dropZone.style.borderColor = 'var(--border)';
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || 
        file.type.startsWith('image/') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword');
    
    if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
    } else {
        showToast('Please drop supported file types only');
    }
});

// File Selection
fileInput.addEventListener('change', (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
});

function addFiles(newFiles) {
    files.push(...newFiles);
    updateFileList();
    updatePreview(newFiles[0]);
    convertBtn.disabled = files.length === 0;
}

function updateFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        let icon = 'fa-file';
        
        if (file.type === 'application/pdf') {
            icon = 'fa-file-pdf';
        } else if (file.type.startsWith('image/')) {
            icon = 'fa-file-image';
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            icon = 'fa-file-excel';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            icon = 'fa-file-word';
        }
        
        const size = (file.size / (1024 * 1024)).toFixed(2);
        
        fileItem.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${file.name}</span>
            <span>(${size} MB)</span>
            <button class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    files.splice(index, 1);
    updateFileList();
    convertBtn.disabled = files.length === 0;
    if (files.length > 0) {
        updatePreview(files[0]);
    } else {
        previewContainer.style.display = 'none';
    }
}

async function updatePreview(file) {
    if (!file) return;
    
    previewContainer.style.display = 'block';
    preview.innerHTML = '';
    
    try {
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            preview.appendChild(canvas);
        } else if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            preview.innerHTML = '<p>Excel preview not available</p>';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            preview.innerHTML = '<p>Word preview not available</p>';
        }
    } catch (error) {
        console.error('Preview error:', error);
        preview.innerHTML = '<p>Preview not available</p>';
    }
}

convertBtn.addEventListener('click', async () => {
    if (files.length === 0) return;

    progressBar.style.display = 'block';
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

    try {
        let completed = 0;
        for (const file of files) {
            const targetFormat = outputFormat.value;
            
            if (file.type === 'application/pdf') {
                if (targetFormat === 'png') {
                    await convertPDFtoPNG(file);
                }
            } else if (file.type.startsWith('image/')) {
                if (targetFormat === 'pdf') {
                    await convertPNGtoPDF(file);
                }
            } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
                if (targetFormat === 'pdf') {
                    await convertExcelToPDF(file);
                } else if (targetFormat === 'png') {
                    await convertExcelToPNG(file);
                }
            } else if (file.type.includes('word') || file.type.includes('document')) {
                if (targetFormat === 'pdf') {
                    await convertWordToPDF(file);
                } else if (targetFormat === 'png') {
                    await convertWordToPNG(file);
                }
            }
            
            completed++;
            progress.style.width = `${(completed / files.length) * 100}%`;
        }
        
        showToast('Conversion completed successfully!');
        convertBtn.innerHTML = '<i class="fas fa-check"></i> Conversion Complete!';
        setTimeout(() => {
            convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert All';
            convertBtn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Conversion error:', error);
        showToast('An error occurred during conversion');
        convertBtn.innerHTML = '<i class="fas fa-times"></i> Conversion Failed';
        setTimeout(() => {
            convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert All';
            convertBtn.disabled = false;
        }, 2000);
    } finally {
        progressBar.style.display = 'none';
        progress.style.width = '0%';
    }
});

async function convertPDFtoPNG(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentScale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const pngUrl = canvas.toDataURL('image/png');
        const fileName = pdfFile.name.replace('.pdf', '');
        downloadFile(pngUrl, `${fileName}_page${pageNum}.png`);
    }
}

async function convertPNGtoPDF(pngFile) {
    const img = new Image();
    img.src = URL.createObjectURL(pngFile);

    await new Promise((resolve) => {
        img.onload = resolve;
    });

    const pdfDoc = await PDFLib.PDFDocument.create();
    let pageWidth = img.width;
    let pageHeight = img.height;

    if (selectedPageSize !== 'auto') {
        const sizes = {
            'a4': [595, 842],
            'letter': [612, 792],
            'legal': [612, 1008]
        };
        [pageWidth, pageHeight] = sizes[selectedPageSize];
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const pngImage = await pdfDoc.embedPng(await pngFile.arrayBuffer());

    const scale = Math.min(
        pageWidth / pngImage.width,
        pageHeight / pngImage.height
    );

    const scaledWidth = pngImage.width * scale;
    const scaledHeight = pngImage.height * scale;
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(pngImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight
    });

    const pdfBytes = await pdfDoc.save();
    const fileName = pngFile.name.replace(/\.[^/.]+$/, '');
    downloadFile(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })), `${fileName}.pdf`);
}

async function convertExcelToPDF(excelFile) {
    try {
        console.log('Starting Excel to PDF conversion...');
        const arrayBuffer = await excelFile.arrayBuffer();
        console.log('File loaded into array buffer');
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        console.log('Excel workbook loaded, sheets:', workbook.SheetNames);
        
        const pdfDoc = await PDFLib.PDFDocument.create();
        
        for (const sheetName of workbook.SheetNames) {
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet);
            
            // Create a temporary div to render the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.width = '100%';
            tempDiv.style.padding = '20px';
            document.body.appendChild(tempDiv);
            
            try {
                // Convert the div to canvas using html2canvas
                console.log('Converting sheet to canvas...');
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    logging: true,
                    backgroundColor: '#ffffff'
                });
                console.log('Canvas created successfully');
                
                // Add the canvas as a page to the PDF
                const page = pdfDoc.addPage([canvas.width, canvas.height]);
                const pngImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
                page.drawImage(pngImage, {
                    x: 0,
                    y: 0,
                    width: canvas.width,
                    height: canvas.height
                });
                console.log('Sheet added to PDF');
            } catch (error) {
                console.error('Error processing sheet:', error);
                throw new Error(`Failed to process sheet ${sheetName}: ${error.message}`);
            } finally {
                document.body.removeChild(tempDiv);
            }
        }
        
        console.log('Saving PDF...');
        const pdfBytes = await pdfDoc.save();
        const fileName = excelFile.name.replace(/\.[^/.]+$/, '');
        downloadFile(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })), `${fileName}.pdf`);
        console.log('Excel to PDF conversion completed successfully');
    } catch (error) {
        console.error('Excel to PDF conversion failed:', error);
        throw error;
    }
}

async function convertExcelToPNG(excelFile) {
    try {
        console.log('Starting Excel to PNG conversion...');
        const arrayBuffer = await excelFile.arrayBuffer();
        console.log('File loaded into array buffer');
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        console.log('Excel workbook loaded, sheets:', workbook.SheetNames);
        
        for (const sheetName of workbook.SheetNames) {
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet);
            
            // Create a temporary div to render the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.width = '100%';
            tempDiv.style.padding = '20px';
            document.body.appendChild(tempDiv);
            
            try {
                // Convert the div to canvas using html2canvas
                console.log('Converting sheet to canvas...');
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    logging: true,
                    backgroundColor: '#ffffff'
                });
                console.log('Canvas created successfully');
                
                const pngUrl = canvas.toDataURL('image/png');
                const fileName = excelFile.name.replace(/\.[^/.]+$/, '');
                downloadFile(pngUrl, `${fileName}_${sheetName}.png`);
                console.log(`Sheet ${sheetName} converted to PNG`);
            } catch (error) {
                console.error('Error processing sheet:', error);
                throw new Error(`Failed to process sheet ${sheetName}: ${error.message}`);
            } finally {
                document.body.removeChild(tempDiv);
            }
        }
        console.log('Excel to PNG conversion completed successfully');
    } catch (error) {
        console.error('Excel to PNG conversion failed:', error);
        throw error;
    }
}

async function convertWordToPDF(wordFile) {
    try {
        console.log('Starting Word to PDF conversion...');
        const arrayBuffer = await wordFile.arrayBuffer();
        console.log('File loaded into array buffer');
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        console.log('Word document converted to HTML');
        
        const html = result.value;
        
        // Create a temporary div to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.width = '100%';
        tempDiv.style.padding = '20px';
        // Make the div invisible but still renderable
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.visibility = 'hidden';
        document.body.appendChild(tempDiv);
        
        try {
            // Convert the div to canvas using html2canvas
            console.log('Converting document to canvas...');
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff',
                allowTaint: true,
                foreignObjectRendering: true
            });
            console.log('Canvas created successfully');
            
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([canvas.width, canvas.height]);
            const pngImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
            
            page.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            });
            
            console.log('Saving PDF...');
            const pdfBytes = await pdfDoc.save();
            const fileName = wordFile.name.replace(/\.[^/.]+$/, '');
            downloadFile(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })), `${fileName}.pdf`);
            console.log('Word to PDF conversion completed successfully');
        } catch (error) {
            console.error('Error processing document:', error);
            throw new Error(`Failed to process document: ${error.message}`);
        } finally {
            document.body.removeChild(tempDiv);
        }
    } catch (error) {
        console.error('Word to PDF conversion failed:', error);
        throw error;
    }
}

async function convertWordToPNG(wordFile) {
    try {
        console.log('Starting Word to PNG conversion...');
        const arrayBuffer = await wordFile.arrayBuffer();
        console.log('File loaded into array buffer');
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        console.log('Word document converted to HTML');
        
        const html = result.value;
        
        // Create a temporary div to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.width = '100%';
        tempDiv.style.padding = '20px';
        // Make the div invisible but still renderable
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.visibility = 'hidden';
        document.body.appendChild(tempDiv);
        
        try {
            // Convert the div to canvas using html2canvas
            console.log('Converting document to canvas...');
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff',
                allowTaint: true,
                foreignObjectRendering: true
            });
            console.log('Canvas created successfully');
            
            const pngUrl = canvas.toDataURL('image/png');
            const fileName = wordFile.name.replace(/\.[^/.]+$/, '');
            downloadFile(pngUrl, `${fileName}.png`);
            console.log('Word to PNG conversion completed successfully');
        } catch (error) {
            console.error('Error processing document:', error);
            throw new Error(`Failed to process document: ${error.message}`);
        } finally {
            document.body.removeChild(tempDiv);
        }
    } catch (error) {
        console.error('Word to PNG conversion failed:', error);
        throw error;
    }
}

function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}