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

# Fix CSS error
RUN sed -i 's|@apply border-border;|@apply border-\\[hsl\\(var\\(--border\\)\\)\\];|g' src/index.css

# Generate Tailwind content configuration
RUN echo "module.exports = {content: ['./src/**/*.{js,jsx,ts,tsx}']}" > tailwind.config.js

# Build the client
RUN NODE_ENV=production npm run build

# Production environment
FROM node:20-alpine

WORKDIR /app

# Copy built client and server files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/drizzle.config.ts ./

# Install production dependencies only
RUN npm install --omit=dev

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["node", "server/server.js"]