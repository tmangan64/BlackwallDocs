# BlackwallDocs

Documentation for Blackwall and other projects, built with [Docusaurus](https://docusaurus.io/).

## Dev

To install and run:

```bash
npm install
npm run start
```

# Adding New Projects

To add a new documentation tab, follow these steps:

### 1. Create the content directory

Create a new folder at the root level with your documentation content:

```
new-project/
  intro.md
  ...
```

Each docs folder needs at least an `intro.md` file.

### 2. Create a sidebar configuration file

Create a new file `sidebarsMyNewDocs.ts` at the root:

```typescript
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  myNewDocsSidebar: [
    "intro",
    // Add more doc IDs or category objects here
  ],
};

export default sidebars;
```

### 3. Register the plugin in docusaurus.config.ts

Add a new entry to the `plugins` array:

```typescript
plugins: [
  // ... existing plugins
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'my-new-docs',           // Unique identifier for this docs instance
      path: 'my-new-docs',         // Folder containing the markdown files
      routeBasePath: 'my-new-docs', // URL path prefix (e.g., /my-new-docs/intro)
      sidebarPath: './sidebarsMyNewDocs.ts',
    },
  ],
],
```

### 4. Add a navbar item

Add an entry to `themeConfig.navbar.items`:

```typescript
navbar: {
  items: [
    // ... existing items
    {
      type: 'doc',
      docId: 'intro',              // The default doc to link to
      docsPluginId: 'my-new-docs', // Must match the plugin id above
      position: 'left',
      label: 'My New Docs',        // Display name in the navbar
    },
  ],
},
```

### 5. Build and verify

```bash
npm run build
npm run start
```

Ensure a hard refresh is performed to clear browser cache and view updated page.
