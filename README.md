# JSON Studio

A modern, web-based JSON editor with a VSCode-like interface. Built with HTML, CSS, and JavaScript, JSON Studio provides a powerful and intuitive way to work with JSON files.

## Features

- **Multiple File Support**: Work with multiple JSON files simultaneously
- **Real-time JSON Validation**: Instant feedback on JSON syntax
- **CodeMirror Integration**: Advanced code editing with syntax highlighting
- **Search & Filter**: Search through JSON data with options for keys and values
- **File Management**: Create, open, save, and manage multiple JSON files
- **Modern UI**: Clean, Apple-inspired interface following Human Interface Guidelines
- **Responsive Design**: Works on both desktop and mobile devices

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Python 3.x (for local development server)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/json-studio.git
cd json-studio
```

2. Start a local server:
```bash
python -m http.server 8080
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

## Usage

### Basic Operations

- **New File**: Click the "New File" button in the sidebar
- **Open File**: Click "Open File" to import an existing JSON file
- **Save File**: Click "Save File" to download the current JSON
- **Add Item**: Enter JSON in the editor and click "Add Item"
- **Search**: Use the search bar to find specific content
- **Format**: Click the format button to prettify JSON
- **Validate**: Click the validate button to check JSON syntax

### File Management

- Switch between open files using the file list in the sidebar
- Close files using the close button (×) next to each file
- Each file maintains its own state and content

### Keyboard Shortcuts

- `Ctrl + Space`: Trigger autocomplete
- `Tab`: Indent code
- `Ctrl + S`: Save file (browser's default save dialog)

## Development

### Project Structure

```
json-studio/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript code
├── README.md          # This file
└── .gitignore         # Git ignore file
```

### Dependencies

- [CodeMirror](https://codemirror.net/) - Code editor
- [Font Awesome](https://fontawesome.com/) - Icons

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by VSCode's interface
- Following Apple's Human Interface Guidelines
- Built with modern web technologies 