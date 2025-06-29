---
sidebar_position: 8
---

# Laravel

Welcome to the Laravel-specific documentation for **On-Codemerge**, a powerful web editor designed for seamless integration into Laravel applications.

## Getting Started with Laravel

To use On-Codemerge in a Laravel application, install the package:

```bash
npm install on-codemerge
```

## Laravel Integration Example

Here's how to integrate On-Codemerge into a Laravel project:

1. **Set Up Laravel Mix**:

```javascript title="webpack.mix.js"
const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
   .postCss('resources/css/app.css', 'public/css', [])
   .copy('node_modules/on-codemerge/public.css', 'public/css/on-codemerge-public.css')
   .copy('node_modules/on-codemerge/index.css', 'public/css/on-codemerge-index.css')
   .copy('node_modules/on-codemerge/plugins/ToolbarPlugin/style.css', 'public/css/toolbar-plugin.css')
   .copy('node_modules/on-codemerge/plugins/AlignmentPlugin/public.css', 'public/css/alignment-plugin-public.css')
   .copy('node_modules/on-codemerge/plugins/AlignmentPlugin/style.css', 'public/css/alignment-plugin.css');
```

2. **Create the Editor Initialization Script**:

```javascript title="resources/js/app.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

class LaravelEditor {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('myEditor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');

    // Register plugins
    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    // Subscribe to content changes
    this.editor.subscribeToContentChange((newContent) => {
      this.updateHiddenField(newContent);
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Laravel!';
    this.editor.setHtml(initialContent);
  }

  updateHiddenField(content) {
    const hiddenField = document.getElementById('editor-content');
    if (hiddenField) {
      hiddenField.value = content;
    }
  }

  getContent() {
    return this.editor ? this.editor.getHtml() : '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LaravelEditor();
});
```

3. **Compile Your Assets**:

```bash
npm run dev
```

4. **Integrate in Blade Template**:

```blade title="welcome.blade.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel On-Codemerge Editor</title>
    <link rel="stylesheet" href="{{ mix('css/on-codemerge-public.css') }}">
    <link rel="stylesheet" href="{{ mix('css/on-codemerge-index.css') }}">
    <link rel="stylesheet" href="{{ mix('css/toolbar-plugin.css') }}">
    <link rel="stylesheet" href="{{ mix('css/alignment-plugin-public.css') }}">
    <link rel="stylesheet" href="{{ mix('css/alignment-plugin.css') }}">
</head>
<body>
    <div class="container">
        <h1>Laravel On-Codemerge Editor</h1>
        
        <form method="post" action="{{ route('save-content') }}">
            @csrf
            <div id="myEditor" style="min-height: 300px;"></div>
            <input type="hidden" id="editor-content" name="content" value="">
            
            <div class="controls">
                <button type="submit">Save Content</button>
                <button type="button" onclick="previewContent()">Preview</button>
            </div>
        </form>
        
        <div id="preview" style="display: none;">
            <h3>Preview:</h3>
            <div id="preview-content"></div>
        </div>
    </div>

    <!-- Initial content (if any) -->
    @if(isset($initialContent))
    <script id="initial-content" type="text/plain">{!! $initialContent !!}</script>
    @endif

    <script src="{{ mix('js/app.js') }}"></script>
    <script>
        function previewContent() {
            const content = document.getElementById('editor-content').value;
            const previewDiv = document.getElementById('preview');
            const previewContent = document.getElementById('preview-content');
            
            previewContent.innerHTML = content;
            previewDiv.style.display = 'block';
        }
    </script>
</body>
</html>
```

5. **Laravel Controller**:

```php title="app/Http/Controllers/EditorController.php"
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Content;

class EditorController extends Controller
{
    public function index()
    {
        $initialContent = '<p>Welcome to On-Codemerge with Laravel!</p>';
        return view('welcome', compact('initialContent'));
    }

    public function saveContent(Request $request)
    {
        $request->validate([
            'content' => 'required|string'
        ]);

        $content = $request->input('content');
        
        // Save content to database
        Content::create([
            'body' => $content,
            'title' => 'Editor Content'
        ]);
        
        \Log::info('Saving content: ' . $content);
        
        return response()->json(['success' => true]);
    }
}
```

6. **Routes**:

```php title="routes/web.php"
use App\Http\Controllers\EditorController;

Route::get('/', [EditorController::class, 'index']);
Route::post('/save-content', [EditorController::class, 'saveContent'])->name('save-content');
```

7. **Model for Content Storage** (Optional):

```php title="app/Models/Content.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'body',
        'title'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

8. **Migration** (Optional):

```php title="database/migrations/YYYY_MM_DD_create_contents_table.php"
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->text('body');
            $table->string('title')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('contents');
    }
};
```

## Key Features

- **Laravel Integration**: Full compatibility with Laravel's asset compilation
- **Mix Support**: Proper integration with Laravel Mix
- **Blade Templates**: Easy integration with Blade templating
- **CSRF Protection**: Built-in CSRF token support
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
