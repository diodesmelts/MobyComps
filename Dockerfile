FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files first to ensure all needed files exist
COPY . ./

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Fix import path issues before build
RUN sed -i 's|import HomePage from "@/pages/home-page"|import HomePage from "./pages/home-page"|g' src/App.tsx && \
    sed -i 's|import CompetitionsPage from "@/pages/competitions-page"|import CompetitionsPage from "./pages/competitions-page"|g' src/App.tsx && \
    sed -i 's|import CompetitionDetail from "@/pages/competition-detail"|import CompetitionDetail from "./pages/competition-detail"|g' src/App.tsx && \
    sed -i 's|import HowToPlayPage from "@/pages/how-to-play"|import HowToPlayPage from "./pages/how-to-play"|g' src/App.tsx && \
    sed -i 's|import AboutUsPage from "@/pages/about-us"|import AboutUsPage from "./pages/about-us"|g' src/App.tsx && \
    sed -i 's|import FAQsPage from "@/pages/faqs"|import FAQsPage from "./pages/faqs"|g' src/App.tsx && \
    sed -i 's|import MyEntriesPage from "@/pages/my-entries"|import MyEntriesPage from "./pages/my-entries"|g' src/App.tsx && \
    sed -i 's|import MyWinsPage from "@/pages/my-wins"|import MyWinsPage from "./pages/my-wins"|g' src/App.tsx && \
    sed -i 's|import AuthPage from "@/pages/auth-page"|import AuthPage from "./pages/auth-page"|g' src/App.tsx && \
    sed -i 's|import CheckoutPage from "@/pages/checkout-page"|import CheckoutPage from "./pages/checkout-page"|g' src/App.tsx && \
    sed -i 's|import CartPage from "@/pages/cart-page"|import CartPage from "./pages/cart-page"|g' src/App.tsx && \
    sed -i 's|import PaymentSuccessPage from "@/pages/payment-success-page"|import PaymentSuccessPage from "./pages/payment-success-page"|g' src/App.tsx && \
    sed -i 's|import NotFound from "@/pages/not-found"|import NotFound from "./pages/not-found"|g' src/App.tsx && \
    sed -i 's|import AdminDashboard from "@/pages/admin/dashboard"|import AdminDashboard from "./pages/admin/dashboard"|g' src/App.tsx && \
    sed -i 's|import AdminCompetitions from "@/pages/admin/competitions"|import AdminCompetitions from "./pages/admin/competitions"|g' src/App.tsx && \
    sed -i 's|import AdminUsers from "@/pages/admin/users"|import AdminUsers from "./pages/admin/users"|g' src/App.tsx && \
    sed -i 's|import AdminSiteConfig from "@/pages/admin/site-config"|import AdminSiteConfig from "./pages/admin/site-config"|g' src/App.tsx && \
    sed -i 's|import AdminSiteContent from "@/pages/admin/site-content"|import AdminSiteContent from "./pages/admin/site-content"|g' src/App.tsx && \
    sed -i 's|import AdminTicketSales from "@/pages/admin/ticket-sales"|import AdminTicketSales from "./pages/admin/ticket-sales"|g' src/App.tsx && \
    sed -i 's|import AdminTicketSalesDetail from "@/pages/admin/ticket-sales-detail"|import AdminTicketSalesDetail from "./pages/admin/ticket-sales-detail"|g' src/App.tsx

# Create a simplified index.css without theme variables
RUN echo '@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap");' > src/index.css && \
    echo '' >> src/index.css && \
    echo '@tailwind base;' >> src/index.css && \
    echo '@tailwind components;' >> src/index.css && \
    echo '@tailwind utilities;' >> src/index.css && \
    echo '' >> src/index.css && \
    echo '/* Base styles for production */' >> src/index.css && \
    echo 'body {' >> src/index.css && \
    echo '  @apply bg-white text-gray-900 font-sans antialiased;' >> src/index.css && \
    echo '  letter-spacing: -0.01em;' >> src/index.css && \
    echo '}' >> src/index.css && \
    echo '' >> src/index.css && \
    echo 'h1, h2, h3, h4, h5, h6 {' >> src/index.css && \
    echo '  @apply font-bold;' >> src/index.css && \
    echo '  letter-spacing: -0.02em;' >> src/index.css && \
    echo '}' >> src/index.css && \
    echo '' >> src/index.css && \
    echo '.competition-progress-indicator {' >> src/index.css && \
    echo '  background-color: #C3DC6F !important;' >> src/index.css && \
    echo '}' >> src/index.css && \
    echo '' >> src/index.css && \
    echo '.oxford-blue {' >> src/index.css && \
    echo '  @apply bg-[#002D5C] text-white;' >> src/index.css && \
    echo '}' >> src/index.css && \
    echo '' >> src/index.css && \
    echo '.kiwi-green {' >> src/index.css && \
    echo '  @apply bg-[#C3DC6F] text-[#002D5C];' >> src/index.css && \
    echo '}' >> src/index.css && \
    echo '' >> src/index.css && \
    echo '.container {' >> src/index.css && \
    echo '  @apply mx-auto max-w-[1400px] px-4 md:px-8;' >> src/index.css && \
    echo '}' >> src/index.css

# Create simplified tailwind config
RUN echo 'module.exports = {' > tailwind.config.js && \
    echo '  content: ["./src/**/*.{js,jsx,ts,tsx}"],' >> tailwind.config.js && \
    echo '  theme: {' >> tailwind.config.js && \
    echo '    extend: {' >> tailwind.config.js && \
    echo '      colors: {' >> tailwind.config.js && \
    echo '        primary: "#002147",' >> tailwind.config.js && \
    echo '        secondary: "#C3DC6F",' >> tailwind.config.js && \
    echo '      }' >> tailwind.config.js && \
    echo '    },' >> tailwind.config.js && \
    echo '  },' >> tailwind.config.js && \
    echo '  plugins: []' >> tailwind.config.js && \
    echo '}' >> tailwind.config.js

# Create simplified vite config
RUN echo 'import { defineConfig } from "vite";' > vite.config.js && \
    echo 'import react from "@vitejs/plugin-react";' >> vite.config.js && \
    echo 'import path from "path";' >> vite.config.js && \
    echo '' >> vite.config.js && \
    echo 'export default defineConfig({' >> vite.config.js && \
    echo '  plugins: [react()],' >> vite.config.js && \
    echo '  resolve: {' >> vite.config.js && \
    echo '    alias: {' >> vite.config.js && \
    echo '      "@": path.resolve(__dirname, "./src"),' >> vite.config.js && \
    echo '      "@shared": path.resolve(__dirname, "../shared"),' >> vite.config.js && \
    echo '    },' >> vite.config.js && \
    echo '  },' >> vite.config.js && \
    echo '  build: {' >> vite.config.js && \
    echo '    outDir: "dist",' >> vite.config.js && \
    echo '    emptyOutDir: true,' >> vite.config.js && \
    echo '  },' >> vite.config.js && \
    echo '});' >> vite.config.js

# Create a simple production server script (using .cjs extension for CommonJS)
RUN echo "const express = require('express');" > /app/server/simple-server.cjs && \
    echo "const path = require('path');" >> /app/server/simple-server.cjs && \
    echo "const fs = require('fs');" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "const app = express();" >> /app/server/simple-server.cjs && \
    echo "const port = process.env.PORT || 5000;" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Log environment info" >> /app/server/simple-server.cjs && \
    echo "console.log('Node.js version:', process.version);" >> /app/server/simple-server.cjs && \
    echo "console.log('Current directory:', process.cwd());" >> /app/server/simple-server.cjs && \
    echo "console.log('Files in current directory:', fs.readdirSync('.'));" >> /app/server/simple-server.cjs && \
    echo "console.log('Files in client directory:', fs.existsSync('./client') ? fs.readdirSync('./client') : 'client dir not found');" >> /app/server/simple-server.cjs && \
    echo "console.log('Files in client/dist directory:', fs.existsSync('./client/dist') ? fs.readdirSync('./client/dist') : 'client/dist dir not found');" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Body parsing middleware" >> /app/server/simple-server.cjs && \
    echo "app.use(express.json());" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Health check endpoint" >> /app/server/simple-server.cjs && \
    echo "app.get('/health', (req, res) => {" >> /app/server/simple-server.cjs && \
    echo "  res.json({ status: 'ok' });" >> /app/server/simple-server.cjs && \
    echo "});" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Serve static files" >> /app/server/simple-server.cjs && \
    echo "const clientDistPath = path.resolve(__dirname, '../client/dist');" >> /app/server/simple-server.cjs && \
    echo "console.log('Using client dist path:', clientDistPath);" >> /app/server/simple-server.cjs && \
    echo "app.use(express.static(clientDistPath));" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// API routes would go here" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Fallback handler for SPA - serve index.html for any unmatched routes" >> /app/server/simple-server.cjs && \
    echo "app.get('*', (req, res) => {" >> /app/server/simple-server.cjs && \
    echo "  const indexPath = path.join(clientDistPath, 'index.html');" >> /app/server/simple-server.cjs && \
    echo "  console.log('Serving index.html from:', indexPath);" >> /app/server/simple-server.cjs && \
    echo "  if (fs.existsSync(indexPath)) {" >> /app/server/simple-server.cjs && \
    echo "    res.sendFile(indexPath);" >> /app/server/simple-server.cjs && \
    echo "  } else {" >> /app/server/simple-server.cjs && \
    echo "    res.status(404).send('Application files not found');" >> /app/server/simple-server.cjs && \
    echo "  }" >> /app/server/simple-server.cjs && \
    echo "});" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Error handler" >> /app/server/simple-server.cjs && \
    echo "app.use((err, req, res, next) => {" >> /app/server/simple-server.cjs && \
    echo "  console.error('Server error:', err);" >> /app/server/simple-server.cjs && \
    echo "  res.status(500).send('Server error');" >> /app/server/simple-server.cjs && \
    echo "});" >> /app/server/simple-server.cjs && \
    echo "" >> /app/server/simple-server.cjs && \
    echo "// Start the server" >> /app/server/simple-server.cjs && \
    echo "app.listen(port, '0.0.0.0', () => {" >> /app/server/simple-server.cjs && \
    echo "  console.log(`Server running on port ${port}`);" >> /app/server/simple-server.cjs && \
    echo "});" >> /app/server/simple-server.cjs

# Build with the simplified configs
RUN NODE_ENV=production npm run build

# Production environment
FROM node:20-alpine

WORKDIR /app

# Copy built client and server files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/simple-server.cjs ./server/
COPY --from=builder /app/package*.json ./

# Install express only
RUN npm install express

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application with the CommonJS server
CMD ["node", "server/simple-server.cjs"]