import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

// Set page title
document.title = "Moby Comps - Prize Competitions";

// Update meta description
let metaDescription = document.querySelector('meta[name="description"]');
if (!metaDescription) {
  metaDescription = document.createElement('meta');
  metaDescription.setAttribute('name', 'description');
  document.head.appendChild(metaDescription);
}
metaDescription.setAttribute('content', 'Win amazing prizes with Moby Comps. Enter our prize competitions with affordable tickets and get a chance to win electronics, cash prizes, travel packages and more!');

// Favicon
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏆</text></svg>';
document.head.appendChild(favicon);

// Create custom font
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
document.head.appendChild(fontLink);

createRoot(root).render(<App />);
