document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addButton = document.getElementById('addButton');
    const downloadButton = document.getElementById('downloadButton');
    const importButton = document.getElementById('importButton');
    const newButton = document.getElementById('newButton');
    const fileInput = document.getElementById('fileInput');
    const jsonItems = document.getElementById('jsonItems');
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const validateButton = document.getElementById('validateButton');
    const clearButton = document.getElementById('clearButton');
    const formatButton = document.getElementById('formatButton');
    const minifyButton = document.getElementById('minifyButton');
    const errorMessage = document.getElementById('errorMessage');
    const itemCount = document.getElementById('itemCount');
    const fileList = document.getElementById('fileList');

    // Initialize state
    let jsonArray = [];
    let openFiles = new Map(); // Map of filename to file data
    let currentFileName = 'Untitled.json';
    let searchTimeout;

    // Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('jsonEditor'), {
        mode: 'application/json',
        theme: 'material',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        lint: true,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Tab': function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                } else {
                    cm.replaceSelection('  ', 'end');
                }
            }
        }
    });

    // Initialize modal elements
    const shortcutsModal = document.getElementById('shortcutsModal');
    const shortcutsButton = document.getElementById('shortcutsButton');
    const closeButton = shortcutsModal.querySelector('.close-button');

    // Initialize conversion buttons
    const convertToYamlButton = document.getElementById('convertToYamlButton');
    const convertToXmlButton = document.getElementById('convertToXmlButton');
    const convertToCsvButton = document.getElementById('convertToCsvButton');

    // Function to create file list item
    function createFileListItem(filename, isActive = false) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        if (isActive) {
            fileItem.classList.add('active');
        }

        const fileIcon = document.createElement('i');
        fileIcon.className = 'fas fa-file-code';
        
        const fileName = document.createElement('span');
        fileName.textContent = filename;

        const closeButton = document.createElement('button');
        closeButton.className = 'file-close-button';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            closeFile(filename);
        };

        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileName);
        fileItem.appendChild(closeButton);
        fileItem.onclick = () => switchFile(filename);

        return fileItem;
    }

    // Function to update file list
    function updateFileList() {
        fileList.innerHTML = '';
        openFiles.forEach((fileData, filename) => {
            fileList.appendChild(createFileListItem(filename, filename === currentFileName));
        });
    }

    // Function to switch between files
    function switchFile(filename) {
        if (filename === currentFileName) return;

        // Save current file
        openFiles.set(currentFileName, {
            data: jsonArray,
            editorContent: editor.getValue()
        });

        // Load new file
        const fileData = openFiles.get(filename);
        if (fileData) {
            currentFileName = filename;
            jsonArray = fileData.data;
            editor.setValue(fileData.editorContent);
            updatePreview();
            updateFileList();
        }
    }

    // Function to close a file
    function closeFile(filename) {
        if (openFiles.size <= 1) {
            // Don't close the last file, create a new one instead
            newButton.click();
            return;
        }

        if (filename === currentFileName) {
            // Switch to another file before closing
            const otherFile = Array.from(openFiles.keys()).find(f => f !== filename);
            if (otherFile) {
                switchFile(otherFile);
            }
        }

        openFiles.delete(filename);
        updateFileList();
    }

    // Function to create item element
    function createItemElement(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'json-item';
        
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(item, null, 2);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Edit';
        editButton.onclick = () => editItem(index);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete';
        deleteButton.onclick = () => deleteItem(index);
        
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        
        itemDiv.appendChild(pre);
        itemDiv.appendChild(actionsDiv);
        
        return itemDiv;
    }

    // Function to update the preview
    function updatePreview() {
        jsonItems.innerHTML = '';
        jsonArray.forEach((item, index) => {
            jsonItems.appendChild(createItemElement(item, index));
        });
        itemCount.textContent = `${jsonArray.length} items`;
        document.title = `${currentFileName} - JSON Studio`;

        // Update current file data
        openFiles.set(currentFileName, {
            data: jsonArray,
            editorContent: editor.getValue()
        });
    }

    // Function to edit an item
    function editItem(index) {
        const item = jsonArray[index];
        editor.setValue(JSON.stringify(item, null, 2));
        deleteItem(index);
    }

    // Function to delete an item
    function deleteItem(index) {
        jsonArray.splice(index, 1);
        updatePreview();
    }

    // Function to validate JSON
    function validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            errorMessage.textContent = '';
            return true;
        } catch (error) {
            errorMessage.textContent = `Invalid JSON: ${error.message}`;
            return false;
        }
    }

    // Function to format JSON
    function formatJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            return jsonString;
        }
    }

    // Function to highlight search results
    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Function to search in JSON
    function searchJSON(searchTerm, searchType) {
        if (!searchTerm) {
            updatePreview();
            return;
        }

        jsonItems.innerHTML = '';
        jsonArray.forEach((item, index) => {
            const itemDiv = createItemElement(item, index);
            const pre = itemDiv.querySelector('pre');
            const itemText = JSON.stringify(item, null, 2);

            if (searchType === 'keys') {
                const keys = Object.keys(item);
                const matchingKeys = keys.filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));
                if (matchingKeys.length > 0) {
                    pre.innerHTML = highlightText(itemText, searchTerm);
                    jsonItems.appendChild(itemDiv);
                }
            } else if (searchType === 'values') {
                const values = Object.values(item).map(v => String(v));
                const matchingValues = values.filter(value => value.toLowerCase().includes(searchTerm.toLowerCase()));
                if (matchingValues.length > 0) {
                    pre.innerHTML = highlightText(itemText, searchTerm);
                    jsonItems.appendChild(itemDiv);
                }
            } else {
                if (itemText.toLowerCase().includes(searchTerm.toLowerCase())) {
                    pre.innerHTML = highlightText(itemText, searchTerm);
                    jsonItems.appendChild(itemDiv);
                }
            }
        });
    }

    // Function to convert JSON to YAML
    function convertToYAML(json) {
        function convertValue(value, indent = '') {
            if (value === null) return 'null';
            if (value === undefined) return '~';
            if (typeof value === 'boolean') return value.toString();
            if (typeof value === 'number') return value.toString();
            if (typeof value === 'string') {
                // Handle special characters and multiline strings
                if (value.includes('\n') || value.includes('"') || value.includes("'")) {
                    return `|-\n${indent}  ${value.split('\n').join(`\n${indent}  `)}`;
                }
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                return value.map(item => `${indent}- ${convertValue(item, indent + '  ')}`).join('\n');
            }
            if (typeof value === 'object') {
                if (Object.keys(value).length === 0) return '{}';
                return Object.entries(value)
                    .map(([key, val]) => {
                        const convertedValue = convertValue(val, indent + '  ');
                        return `${indent}${key}: ${convertedValue.startsWith('|') ? '\n' + convertedValue : convertedValue}`;
                    })
                    .join('\n');
            }
            return String(value);
        }
        return convertValue(json);
    }

    // Function to convert JSON to XML
    function convertToXML(json) {
        function sanitizeTagName(name) {
            // Convert to valid XML tag name
            return name.replace(/[^a-zA-Z0-9_]/g, '_')
                      .replace(/^[0-9]/, 'n$&')
                      .replace(/^xml/i, 'xml_');
        }

        function convertValue(value, tagName = 'item') {
            const safeTagName = sanitizeTagName(tagName);
            
            if (value === null) return `<${safeTagName} xsi:nil="true"/>`;
            if (value === undefined) return `<${safeTagName} xsi:nil="true"/>`;
            if (typeof value === 'boolean') return `<${safeTagName}>${value}</${safeTagName}>`;
            if (typeof value === 'number') return `<${safeTagName}>${value}</${safeTagName}>`;
            if (typeof value === 'string') {
                // Handle special characters
                const escapedValue = value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
                return `<${safeTagName}>${escapedValue}</${safeTagName}>`;
            }
            if (Array.isArray(value)) {
                if (value.length === 0) return `<${safeTagName}/>`;
                return value.map(item => convertValue(item, safeTagName)).join('');
            }
            if (typeof value === 'object') {
                if (Object.keys(value).length === 0) return `<${safeTagName}/>`;
                const children = Object.entries(value)
                    .map(([key, val]) => convertValue(val, key))
                    .join('');
                return `<${safeTagName}>${children}</${safeTagName}>`;
            }
            return `<${safeTagName}>${String(value)}</${safeTagName}>`;
        }

        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
        const xsiNamespace = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
        return `${xmlDeclaration}\n<root ${xsiNamespace}>${convertValue(json, 'root')}</root>`;
    }

    // Function to convert JSON to CSV
    function convertToCSV(json) {
        // Handle different input types
        let dataArray;
        
        if (Array.isArray(json)) {
            if (json.length === 0) {
                throw new Error('Array is empty. Please provide data to convert.');
            }
            dataArray = json;
        } else if (typeof json === 'object' && json !== null) {
            // If it's a single object, convert it to an array with one item
            dataArray = [json];
        } else {
            throw new Error('Input must be an object or an array of objects. Received: ' + typeof json);
        }

        // Validate each item in the array
        dataArray.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) {
                throw new Error(`Item at index ${index} must be an object. Received: ${typeof item}`);
            }
        });

        // Get all possible headers from all objects
        const headers = [...new Set(dataArray.flatMap(obj => Object.keys(obj)))];

        if (headers.length === 0) {
            throw new Error('No properties found in the objects. Each object must have at least one property.');
        }

        // Escape CSV values
        function escapeCSV(value) {
            if (value === null || value === undefined) return '';
            
            // Convert value to string and handle special cases
            let stringValue;
            if (typeof value === 'object') {
                // For nested objects and arrays, convert to JSON string
                stringValue = JSON.stringify(value);
            } else {
                stringValue = String(value);
            }

            // Escape special characters
            if (stringValue.includes(',') || 
                stringValue.includes('"') || 
                stringValue.includes('\n') || 
                stringValue.includes('\r')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }

        // Convert each object to a row
        const rows = dataArray.map(obj => {
            return headers.map(header => {
                const value = obj[header];
                return escapeCSV(value);
            });
        });

        // Add BOM for Excel compatibility
        const BOM = '\uFEFF';
        
        // Combine headers and rows
        return BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Function to copy text to clipboard with fallback
    function copyToClipboard(text) {
        // Try using the Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        // Fallback for non-secure contexts or when Clipboard API is not available
        return new Promise((resolve, reject) => {
            try {
                // Create a temporary textarea element
                const textArea = document.createElement('textarea');
                textArea.value = text;
                
                // Make the textarea out of viewport
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                
                // Select and copy the text
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                
                // Clean up
                document.body.removeChild(textArea);
                
                if (successful) {
                    resolve();
                } else {
                    reject(new Error('Failed to copy text'));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    // Function to convert JSON to other formats
    function convertFormat(format) {
        try {
            const json = JSON.parse(editor.getValue());
            let result;
            let mimeType;
            let fileExtension;

            switch (format) {
                case 'yaml':
                    result = convertToYAML(json);
                    mimeType = 'text/yaml';
                    fileExtension = 'yml';
                    break;
                case 'xml':
                    result = convertToXML(json);
                    mimeType = 'application/xml';
                    fileExtension = 'xml';
                    break;
                case 'csv':
                    result = convertToCSV(json);
                    mimeType = 'text/csv;charset=utf-8';
                    fileExtension = 'csv';
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            // Create a modal to show the result
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Convert to ${format.toUpperCase()}</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="format-options">
                            <div class="format-option ${format === 'yaml' ? 'active' : ''}" data-format="yaml">
                                <i class="fas fa-file-code"></i>
                                <span>YAML</span>
                            </div>
                            <div class="format-option ${format === 'xml' ? 'active' : ''}" data-format="xml">
                                <i class="fas fa-file-code"></i>
                                <span>XML</span>
                            </div>
                            <div class="format-option ${format === 'csv' ? 'active' : ''}" data-format="csv">
                                <i class="fas fa-file-alt"></i>
                                <span>CSV</span>
                            </div>
                        </div>

                        <div class="conversion-settings">
                            <div class="settings-group">
                                <h4>Output Settings</h4>
                                <div class="settings-row">
                                    <label class="settings-label">Encoding</label>
                                    <div class="settings-control">
                                        <select id="encodingSelect">
                                            <option value="utf8">UTF-8</option>
                                            <option value="utf16">UTF-16</option>
                                            <option value="ascii">ASCII</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-label">Line Endings</label>
                                    <div class="settings-control">
                                        <select id="lineEndingsSelect">
                                            <option value="lf">LF (Unix)</option>
                                            <option value="crlf">CRLF (Windows)</option>
                                            <option value="cr">CR (Mac)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="conversion-result">${result}</div>
                        <div class="conversion-actions">
                            <button class="primary-button" id="copyConvertedButton">
                                <i class="fas fa-copy"></i>
                                Copy to Clipboard
                            </button>
                            <button class="primary-button" id="downloadConvertedButton">
                                <i class="fas fa-download"></i>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            const closeButton = modal.querySelector('.close-button');
            const copyButton = modal.querySelector('#copyConvertedButton');
            const downloadButton = modal.querySelector('#downloadConvertedButton');
            const formatOptions = modal.querySelectorAll('.format-option');
            const encodingSelect = modal.querySelector('#encodingSelect');
            const lineEndingsSelect = modal.querySelector('#lineEndingsSelect');

            // Format option click handler
            formatOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const newFormat = option.dataset.format;
                    if (newFormat !== format) {
                        convertFormat(newFormat);
                        document.body.removeChild(modal);
                    }
                });
            });

            // Close button handler
            closeButton.onclick = () => {
                document.body.removeChild(modal);
            };

            // Close modal when clicking outside
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            };

            // Copy button handler
            copyButton.onclick = async () => {
                try {
                    await copyToClipboard(result);
                    copyButton.classList.add('success-animation');
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.classList.remove('success-animation');
                    }, 2000);
                } catch (error) {
                    errorMessage.textContent = 'Failed to copy to clipboard: ' + error.message;
                }
            };

            // Download button handler
            downloadButton.onclick = () => {
                try {
                    const encoding = encodingSelect.value;
                    const lineEndings = lineEndingsSelect.value;
                    let processedResult = result;

                    // Apply line endings
                    if (lineEndings === 'crlf') {
                        processedResult = result.replace(/\n/g, '\r\n');
                    } else if (lineEndings === 'cr') {
                        processedResult = result.replace(/\n/g, '\r');
                    }

                    // Create blob with appropriate encoding
                    const blob = new Blob([processedResult], { 
                        type: `${mimeType};charset=${encoding}` 
                    });

                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted.${fileExtension}`;
                    
                    // Trigger download
                    document.body.appendChild(a);
                    a.click();
                    
                    // Cleanup
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    // Show success animation
                    downloadButton.classList.add('success-animation');
                    setTimeout(() => {
                        downloadButton.classList.remove('success-animation');
                    }, 300);
                } catch (error) {
                    errorMessage.textContent = 'Failed to download file: ' + error.message;
                }
            };

        } catch (error) {
            errorMessage.textContent = `Error converting to ${format.toUpperCase()}: ${error.message}`;
        }
    }

    // Event Listeners
    addButton.addEventListener('click', () => {
        try {
            const inputValue = editor.getValue().trim();
            
            if (!inputValue) {
                errorMessage.textContent = 'Please enter some JSON data';
                return;
            }
            
            if (!validateJSON(inputValue)) return;
            
            const newItem = JSON.parse(inputValue);
            jsonArray.push(newItem);
            updatePreview();
            editor.setValue('');
            errorMessage.textContent = '';
            
        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
        }
    });

    newButton.addEventListener('click', () => {
        // Save current file if it has content
        if (jsonArray.length > 0 || editor.getValue().trim()) {
            openFiles.set(currentFileName, {
                data: jsonArray,
                editorContent: editor.getValue()
            });
        }

        // Create new file
        currentFileName = `Untitled-${Date.now()}.json`;
        jsonArray = [];
        editor.setValue('');
        errorMessage.textContent = '';
        
        // Add to open files
        openFiles.set(currentFileName, {
            data: jsonArray,
            editorContent: ''
        });
        
        updatePreview();
        updateFileList();
    });

    downloadButton.addEventListener('click', () => {
        const jsonString = JSON.stringify(jsonArray, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = JSON.parse(event.target.result);
                    currentFileName = file.name;
                    
                    if (Array.isArray(content)) {
                        jsonArray = content;
                    } else {
                        jsonArray = [content];
                    }

                    // Add to open files
                    openFiles.set(currentFileName, {
                        data: jsonArray,
                        editorContent: editor.getValue()
                    });

                    updatePreview();
                    updateFileList();
                } catch (error) {
                    errorMessage.textContent = `Error reading file: ${error.message}`;
                }
            };
            reader.readAsText(file);
        }
    });

    validateButton.addEventListener('click', () => {
        validateJSON(editor.getValue());
    });

    clearButton.addEventListener('click', () => {
        editor.setValue('');
        errorMessage.textContent = '';
    });

    formatButton.addEventListener('click', () => {
        const formatted = formatJSON(editor.getValue());
        editor.setValue(formatted);
    });

    minifyButton.addEventListener('click', () => {
        try {
            const parsed = JSON.parse(editor.getValue());
            editor.setValue(JSON.stringify(parsed));
        } catch (error) {
            errorMessage.textContent = `Invalid JSON: ${error.message}`;
        }
    });

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchJSON(e.target.value, searchType.value);
        }, 300);
    });

    searchType.addEventListener('change', () => {
        searchJSON(searchInput.value, searchType.value);
    });

    // Show shortcuts modal
    shortcutsButton.addEventListener('click', () => {
        shortcutsModal.classList.add('show');
    });

    // Close shortcuts modal
    closeButton.addEventListener('click', () => {
        shortcutsModal.classList.remove('show');
    });

    // Close modal when clicking outside
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.classList.remove('show');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts if user is typing in the editor
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            return;
        }

        // Ctrl/Cmd + N: New File
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            newButton.click();
        }

        // Ctrl/Cmd + O: Open File
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            importButton.click();
        }

        // Ctrl/Cmd + S: Save File
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            downloadButton.click();
        }

        // Ctrl/Cmd + F: Focus Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }

        // Ctrl/Cmd + Shift + F: Format JSON
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            formatButton.click();
        }

        // Ctrl/Cmd + Shift + M: Minify JSON
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            minifyButton.click();
        }

        // Ctrl/Cmd + Enter: Add Item
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            addButton.click();
        }

        // Escape: Close modal
        if (e.key === 'Escape') {
            shortcutsModal.classList.remove('show');
        }
    });

    // Add keyboard shortcut hints to buttons
    const addShortcutHint = (button, shortcut) => {
        const title = button.getAttribute('title');
        button.setAttribute('title', `${title} (${shortcut})`);
    };

    addShortcutHint(newButton, 'Ctrl+N');
    addShortcutHint(importButton, 'Ctrl+O');
    addShortcutHint(downloadButton, 'Ctrl+S');
    addShortcutHint(formatButton, 'Ctrl+Shift+F');
    addShortcutHint(minifyButton, 'Ctrl+Shift+M');
    addShortcutHint(addButton, 'Ctrl+Enter');

    // Event Listeners for conversion buttons
    convertToYamlButton.addEventListener('click', () => convertFormat('yaml'));
    convertToXmlButton.addEventListener('click', () => convertFormat('xml'));
    convertToCsvButton.addEventListener('click', () => convertFormat('csv'));

    // Close modals when clicking outside
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.classList.remove('show');
        }
    });

    // Close modals when clicking close button
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.remove('show');
        });
    });

    // Initialize with a new file
    newButton.click();
}); 