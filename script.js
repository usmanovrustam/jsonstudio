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

    // State management
    let openFiles = new Map(); // Map of filename to file data
    let currentFileName = 'Untitled.json';
    let searchTimeout;

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

    // Initialize with a new file
    newButton.click();
}); 