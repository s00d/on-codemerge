# on-codemerge Demo

Demo example of using the on-codemerge WYSIWYG editor.

## Description

This demo application shows the main capabilities of the on-codemerge editor:

- 🎨 Rich text formatting
- 📋 Creating and editing tables
- 🖼️ Inserting images
- 🔗 Creating links
- 📝 Working with lists
- 🎨 Color styling
- 🔧 Content alignment
- 📦 Block elements
- 💻 Code blocks
- 📤 Content export

## Installation

1. Make sure you have pnpm installed:

```bash
npm install -g pnpm
```

2. Install dependencies:

```bash
pnpm install
```

## Running

### Development mode

```bash
pnpm dev
```

The application will open in your browser at http://localhost:3001

### Production build

```bash
pnpm build
```

### Preview build

```bash
pnpm preview
```

## Usage

1. **Editing**: Click in the editor area and start typing
2. **Formatting**: Use the toolbar for formatting
3. **Get HTML**: Click "Get HTML" button to view generated code
4. **Set Content**: Click "Set Content" to load an example
5. **Clear**: Click "Clear" to remove all content

## Project Structure

```
demo/
├── index.html          # Main HTML page
├── main.ts             # TypeScript application code
├── package.json        # Project dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Technologies

- **on-codemerge** - main WYSIWYG editor
- **TypeScript** - programming language
- **Vite** - build tool and dev server
- **HTML/CSS** - markup and styles

## Support

If you have questions or issues, refer to the main on-codemerge documentation or create an issue in the project repository.
