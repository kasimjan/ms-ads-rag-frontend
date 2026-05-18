import * as React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./App.css";

// App.jsx is written to also work in a no-bundler CDN preview, so it reads
// hooks off the global `React`. Make sure that exists before it loads.
window.React = React;

await import("./App.jsx");

const App = window.App;

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
