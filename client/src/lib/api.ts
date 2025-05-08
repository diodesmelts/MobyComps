import { apiRequest } from "./queryClient";

// Competition API
export const competitionApi = {
  getAllCompetitions: () => 
    apiRequest("GET", "/api/competitions").then(res => res.json()),
  
  getCompetitionById: (id: string) => 
    apiRequest("GET", `/api/competitions/${id}`).then(res => res.json()),
  
  getCompetitionsByCategory: (category: string) => 
    apiRequest("GET", `/api/competitions?category=${category}`).then(res => res.json()),
  
  createCompetition: (data: any) => 
    apiRequest("POST", "/api/competitions", data).then(res => res.json()),
  
  updateCompetition: (id: string, data: any) => 
    apiRequest("PATCH", `/api/competitions/${id}`, data).then(res => res.json()),
  
  deleteCompetition: (id: string) => 
    apiRequest("DELETE", `/api/competitions/${id}`).then(res => res.json()),
};

// Ticket API
export const ticketApi = {
  getAvailableTickets: (competitionId: string) => 
    apiRequest("GET", `/api/tickets/${competitionId}/available`).then(res => res.json()),
  
  reserveTickets: (competitionId: string, ticketNumbers: number[], quizAnswer: string) => 
    apiRequest("POST", `/api/tickets/${competitionId}/reserve`, { ticketNumbers, quizAnswer }).then(res => res.json()),
  
  releaseTickets: (competitionId: string, ticketNumbers: number[]) => 
    apiRequest("POST", `/api/tickets/${competitionId}/release`, { ticketNumbers }).then(res => res.json()),
};

// Cart API
export const cartApi = {
  getCart: () => 
    apiRequest("GET", "/api/cart").then(res => res.json()),
  
  addToCart: (competitionId: string, ticketNumbers: number[]) => 
    apiRequest("POST", "/api/cart/add", { competitionId, ticketNumbers }).then(res => res.json()),
  
  removeFromCart: (cartItemId: string) => 
    apiRequest("DELETE", `/api/cart/remove/${cartItemId}`).then(res => res.ok),
  
  clearCart: () => 
    apiRequest("DELETE", "/api/cart/clear").then(res => res.ok),
};

// Payment API
export const paymentApi = {
  createPaymentIntent: () => 
    apiRequest("POST", "/api/create-payment-intent").then(res => res.json()),
  
  processPayment: (paymentIntentId: string) => 
    apiRequest("POST", "/api/process-payment", { paymentIntentId }).then(res => res.json()),
};

// User API
export const userApi = {
  getEntries: () => 
    apiRequest("GET", "/api/user/entries").then(res => res.json()),
  
  getWins: () => 
    apiRequest("GET", "/api/user/wins").then(res => res.json()),
};

// Admin API
export const adminApi = {
  getUsers: () => 
    apiRequest("GET", "/api/admin/users").then(res => res.json()),
  
  updateUser: (id: string, data: any) => 
    apiRequest("PATCH", `/api/admin/users/${id}`, data).then(res => res.json()),
  
  getSiteConfig: () => 
    apiRequest("GET", "/api/admin/config").then(res => res.json()),
  
  updateSiteConfig: (data: any) => 
    apiRequest("PATCH", "/api/admin/config", data).then(res => res.json()),
  
  getDashboardStats: () => 
    apiRequest("GET", "/api/admin/stats").then(res => res.json()),
  
  uploadImage: (formData: FormData) => {
    // Note: apiRequest doesn't handle FormData correctly, so we use fetch directly
    return fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  },
};
