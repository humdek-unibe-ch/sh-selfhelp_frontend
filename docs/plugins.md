# Plugin System Overview

## 1. Backend API Returns Installed Plugins
Your Symfony backend returns something like:

```json
[
  {
    "name": "chat",
    "remoteEntryUrl": "https://plugins.example.com/chat/remoteEntry.js",
    "exposedModule": "./PluginEntry" // The module to load
  },
  {
    "name": "foo",
    "remoteEntryUrl": "https://plugins.example.com/foo/remoteEntry.js",
    "exposedModule": "./PluginEntry"
  }
]
```

## 2. Frontend Fetches Plugins on Startup
In your React app, on app load or user login, fetch this list.

## 3. Dynamic Remote Loader Utility
Here's a refined utility (fixes race-conditions, avoids duplicate loads, supports multiple plugins):
```javascript
// pluginLoader.js
const loadedRemotes = {};

export async function loadRemotePlugin(remoteUrl, scope, module) {
  if (!window[scope]) {
    if (!loadedRemotes[scope]) {
      loadedRemotes[scope] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = remoteUrl;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load remote: ${remoteUrl}`));
        document.head.appendChild(script);
      });
    }
    await loadedRemotes[scope];
    await __webpack_init_sharing__('default');
    await window[scope].init(__webpack_share_scopes__.default);
  }
  const factory = await window[scope].get(module);
  return factory();
}
```

## 4. How Plugins Work
Each plugin is built completely independently.

In its `webpack.config.js`, it exposes a standard entry, e.g. `./PluginEntry` (the "contract" is up to you).

The entry exports a default React component or a function returning components/metadata.

**Example plugin:**

```js
// src/PluginEntry.jsx
import React from "react";
import ChatIcon from "./ChatIcon";
import ChatPage from "./ChatPage";

// "contract" can be a default object, or a function
export default {
  slot: 'profile-icons',
  render: (props) => <ChatIcon {...props} />,
  routes: [
    { path: "/chat", component: ChatPage }
  ]
};
```

## 5. Core App Discovers and Loads Plugins
### A. On App Load:
- Fetch enabled plugins from API.
- For each, call `loadRemotePlugin(remoteEntryUrl, scope, module)` (e.g. `scope='chat'`, `module='./PluginEntry'`).

### B. Plugin Registration Pattern
- After loading the plugin, store its exports in a runtime registry.
- You can then render plugins for each slot.

**Minimal registry:**

```js
// pluginRegistry.js
const registry = {};

export function registerPlugin(plugin) {
  if (!registry[plugin.slot]) registry[plugin.slot] = [];
  registry[plugin.slot].push(plugin);
}

export function getPlugins(slot) {
  return registry[slot] || [];
}
```

## 6. Rendering Plugin Content in UI Slots
In your React components, you inject plugin UI where you want:

```jsx
import { getPlugins } from "./pluginRegistry";

function PluginHook({ slot, ...props }) {
  const plugins = getPlugins(slot);
  return (
    <>
      {plugins.map((plugin, i) => plugin.render ? plugin.render(props) : null)}
    </>
  );
}
```

**Example in Profile:**

```jsx
function UserProfile(props) {
  return (
    <div>
      {/* Profile info ... */}
      <PluginHook slot="profile-icons" user={props.user} />
    </div>
  );
}
```

## 7. Routing
If plugins want to register routes:
- Collect routes from each plugin object.
- Dynamically inject them into your React Router setup.

## 8. No Core Knowledge Needed
- Plugins can be added or removed anytime: just update the backend’s list.
- Core app does not import or even know plugin names or details.
- Slots are just named extension points.

## 9. Example Full Flow (Pseudo-code)

```js
// On app start
const pluginsFromAPI = await fetch('/api/plugins/enabled').then(r => r.json());

for (const pluginMeta of pluginsFromAPI) {
  const plugin = await loadRemotePlugin(pluginMeta.remoteEntryUrl, pluginMeta.name, pluginMeta.exposedModule);
  registerPlugin(plugin.default || plugin);
}
```

## 10. Advantages
- Completely decoupled: Plugins have their own lifecycle.
- Core can be upgraded, plugins can be added/removed, no need to rebuild/redeploy the whole system.
- You can even support plugin hot reloading in future.

## 11. Contract Flexibility
- Your only "contract" is what you expect plugins to export: usually, an object with slot names and render functions, or similar.
- Can support icons, menu items, pages, widgets, whatever you need.

## 12. Security & Safety
- Only load trusted plugins—validate URLs from backend.
- If plugins are untrusted, consider running them in an iframe or web worker, but that’s more advanced.

---

## Summary
With dynamic Module Federation + runtime registry + named slots:
- Plugins are 100% decoupled.
- Core never needs to know about them until they’re installed and activated.
- No static imports, no rebuilds.

---

Do you want:
- A simple working repo template?
- Sample Webpack config for plugins and host?
- More detail on routing/pages injection?

Or advice on advanced patterns (plugin dependencies, versioning, sandboxing)?

Let me know your next focus!