# Setting Up the Embeddable Chat Package

This guide shows how to set up and use the newly created `@chat-overlay/simple-chat-interface` package.

## 📦 Package Location

The embeddable chat component is now available as a local npm package at:
```
packages/simple-chat-interface/
```

## 🚀 Quick Start

### 1. Install Dependencies in the Package

```bash
cd packages/simple-chat-interface
npm install
```

### 2. Build the Package

```bash
npm run build
```

This will compile TypeScript and generate the `dist/` folder with:
- Compiled JavaScript
- TypeScript declaration files (.d.ts)
- Source maps

### 3. Install the Package in the Main App

From the root directory:

```bash
npm install
```

This will automatically link the local package (already configured in `package.json` as `"@chat-overlay/simple-chat-interface": "file:./packages/simple-chat-interface"`).

### 4. Run the Application

The main app (`src/index.tsx`) has been updated to use the embeddable package:

```bash
npm start
```

## 🎯 What Changed

### Main App Updates

1. **`src/index.tsx`** - Now imports from the package:
   ```tsx
   import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';
   ```

2. **Application Structure**:
   ```tsx
   <ChatThemeProvider>
     <Box>
       <ChatHeader />  {/* Application-specific header */}
       <SimpleChatInterface 
         backendUrl={config.backendUrl}
         onError={(error) => console.error('Chat error:', error)}
       />
     </Box>
   </ChatThemeProvider>
   ```

3. **Environment Variables** - Simplified to just:
   - `REACT_APP_BACKEND_URL` (the only required variable)

## 📚 Package Features

### Components Exported

- `SimpleChatInterface` - Main chat interface component
- `ChatThemeProvider` - Theme wrapper with customization options

### Props Available

```typescript
interface SimpleChatInterfaceProps {
  backendUrl: string;              // Required: Backend proxy URL
  initialAgent?: string;           // Optional: Initial agent to select
  onError?: (error: string) => void; // Optional: Error callback
  className?: string;              // Optional: CSS class
  style?: React.CSSProperties;    // Optional: Inline styles
}

interface ThemeConfig {
  primary?: string;    // Primary color
  secondary?: string;  // Secondary color
  mode?: 'light' | 'dark';  // Theme mode
}
```

### Usage Examples

#### Basic Usage
```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function MyApp() {
  return (
    <ChatThemeProvider>
      <SimpleChatInterface backendUrl="http://localhost:3001" />
    </ChatThemeProvider>
  );
}
```

#### With Custom Theme
```tsx
<ChatThemeProvider theme={{ mode: 'light', primary: '#1976d2' }}>
  <SimpleChatInterface backendUrl="http://localhost:3001" />
</ChatThemeProvider>
```

#### With Error Handling
```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  onError={(error) => {
    console.error('Chat error:', error);
    // Handle error (show notification, log to service, etc.)
  }}
/>
```

## 🔄 Development Workflow

### Making Changes to the Package

1. Edit files in `packages/simple-chat-interface/src/`
2. Rebuild the package: `cd packages/simple-chat-interface && npm run build`
3. The main app will use the updated package automatically
4. Restart the main app: `npm start` (from root)

### TypeScript Support

The package includes full TypeScript support with:
- Type definitions exported from `src/index.ts`
- Declaration files generated in `dist/`
- IntelliSense support in consuming applications

## 📖 Full Documentation

See `packages/simple-chat-interface/README.md` for complete documentation including:
- Installation instructions
- All props and their types
- Backend API requirements
- Advanced usage examples

## 🎨 Customization

The package allows you to:
- Use your own MUI theme (skip `ChatThemeProvider`)
- Customize colors via theme config
- Add custom styling via `className` and `style` props
- Handle errors with `onError` callback

## ✅ Benefits of the Package Approach

1. **Reusable** - Can be embedded in any React application
2. **Self-contained** - All dependencies and logic in one place
3. **Type-safe** - Full TypeScript support
4. **Themeable** - Easy to customize appearance
5. **Lightweight** - No unnecessary dependencies
6. **Maintainable** - Single source of truth for the chat interface

## 🚢 Publishing (Optional)

To publish to npm (if desired):

1. Update version in `packages/simple-chat-interface/package.json`
2. Add your npm registry information
3. Run: `cd packages/simple-chat-interface && npm publish`

Then other projects can install via:
```bash
npm install @chat-overlay/simple-chat-interface
```

