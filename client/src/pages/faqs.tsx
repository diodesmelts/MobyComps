import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, HelpCircle } from "lucide-react";
import { Link } from "wouter";

// FAQ data organized by categories
const faqData = {
  general: [
    {
      question: "What is Moby Comps?",
      answer: "Moby Comps is an online prize competition platform where users can enter competitions to win amazing prizes for affordable ticket prices. We offer a wide range of prizes including electronics, cash, travel packages, and more."
    },
    {
      question: "Is Moby Comps legitimate?",
      answer: "Yes, Moby Comps is a fully legitimate and registered business in the UK. We operate under all necessary gambling regulations and licenses. All our draws are conducted using an audited random number generator to ensure fairness and transparency."
    },
    {
      question: "How old do I need to be to enter competitions?",
      answer: "You must be at least 18 years old to enter our competitions. We verify age during registration and may request additional verification before prize delivery."
    },
    {
      question: "Where do you deliver prizes?",
      answer: "We currently deliver prizes to all addresses within the United Kingdom. For international winners, we offer cash alternatives that can be transferred internationally."
    }
  ],
  entries: [
    {
      question: "How do I enter a competition?",
      answer: "To enter a competition, browse our active competitions, select one you'd like to enter, answer the skill-based question, choose your ticket numbers, and complete the purchase process. Once confirmed, your tickets will be registered for the draw."
    },
    {
      question: "Can I choose my ticket numbers?",
      answer: "Yes! You can select specific ticket numbers for each competition, provided they are still available. We also offer a 'Lucky Dip' feature that randomly selects available numbers for you."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through our secure Stripe payment gateway. We also support Apple Pay and Google Pay for mobile users."
    },
    {
      question: "How long are tickets reserved in my cart?",
      answer: "Tickets are reserved in your cart for 10 minutes. After this time, they will be released back into the available pool if the purchase is not completed."
    }
  ],
  winners: [
    {
      question: "How are winners selected?",
      answer: "Winners are selected using a fully automated random number generator on the specified draw date. The process is completely random and fair, giving all ticket holders an equal chance to win."
    },
    {
      question: "How will I know if I've won?",
      answer: "If you're a winner, you'll be notified immediately via email and SMS. You can also check the 'My Wins' section of your account dashboard. All winners are also announced on our website and social media channels."
    },
    {
      question: "When and how do I receive my prize?",
      answer: "Most prizes are delivered within 14 working days of the draw. Cash prizes are typically transferred within 3-5 working days. For high-value items or experiences, our team will contact you to arrange delivery or scheduling."
    },
    {
      question: "Can I choose a cash alternative instead of the physical prize?",
      answer: "Yes, most of our prizes offer a cash alternative which is listed on the competition page. If you win, you'll be given the option to choose between the physical prize or the cash alternative."
    }
  ],
  account: [
    {
      question: "How do I create an account?",
      answer: "You can create an account by clicking the 'Sign In' button at the top of our website and selecting 'Register'. You'll need to provide a valid email address, create a username and password, and complete our verification process."
    },
    {
      question: "How do I reset my password?",
      answer: "If you've forgotten your password, click 'Sign In', then 'Forgot Password'. Enter your email address, and we'll send you a link to reset your password. For security, this link expires after 30 minutes."
    },
    {
      question: "Can I have multiple accounts?",
      answer: "No, our terms of service prohibit users from creating multiple accounts. Any accounts found to be duplicates may be suspended and any entries associated with duplicate accounts may be invalidated."
    },
    {
      question: "How do I close my account?",
      answer: "To close your account, please contact our customer support team at support@mobycomps.com. Please note that closing your account will not affect any active competition entries you have."
    }
  ],
  technical: [
    {
      question: "What should I do if the website isn't working?",
      answer: "If you're experiencing technical issues, try clearing your browser cache and cookies, or try a different browser. If problems persist, please contact our support team with details of the issue including screenshots if possible."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, all payment processing is handled by Stripe, a PCI-DSS compliant payment processor. We never store your full card details on our servers."
    },
    {
      question: "Can I use Moby Comps on mobile devices?",
      answer: "Yes, our website is fully responsive and works on all modern smartphones and tablets. We recommend using the latest version of Chrome, Safari, or Firefox for the best experience."
    },
    {
      question: "What cookies does the website use?",
      answer: "We use essential cookies for site functionality, as well as analytics cookies to help us improve our service. You can manage your cookie preferences in the footer of our website. For more details, please see our Privacy Policy."
    }
  ]
};

export default function FAQsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{ category: string; index: number; question: string; answer: string }[]>([]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results: { category: string; index: number; question: string; answer: string }[] = [];
    
    // Search through all categories
    Object.entries(faqData).forEach(([category, questions]) => {
      questions.forEach((item, index) => {
        if (
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
        ) {
          results.push({
            category,
            index,
            question: item.question,
            answer: item.answer
          });
        }
      });
    });
    
    setSearchResults(results);
  };
  
  // Clear search results
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#002D5C] mb-2">Frequently Asked Questions</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Moby Comps, our competitions, and how everything works.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                )}
              </div>
              <Button type="submit" className="ml-2 bg-[#002D5C]">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Display search results or FAQ tabs */}
          {searchResults.length > 0 ? (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#002D5C]">
                    Search Results ({searchResults.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={clearSearch}>
                    Clear Results
                  </Button>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {searchResults.map((result, idx) => (
                    <AccordionItem key={idx} value={`result-${idx}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {result.question}
                        <span className="ml-2 text-xs bg-[#8EE000]/20 text-[#002D5C] px-2 py-0.5 rounded-full">
                          {result.category}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        {result.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full mb-6"
              >
                <TabsList className="w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="entries">Entries</TabsTrigger>
                  <TabsTrigger value="winners">Winners</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                
                {Object.entries(faqData).map(([category, questions]) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {questions.map((item, idx) => (
                          <AccordionItem key={idx} value={`${category}-${idx}`}>
                            <AccordionTrigger className="text-left font-medium">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
          
          {/* Contact Support */}
          <div className="max-w-3xl mx-auto mt-12 bg-[#002D5C] text-white rounded-lg shadow-md p-8 text-center">
            <HelpCircle className="h-12 w-12 text-[#8EE000] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Still Have Questions?</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              If you couldn't find the answer you were looking for, our friendly support team is ready to help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-white text-[#002D5C] hover:bg-gray-100">
                <Mail className="h-4 w-4 mr-2" />
                <a href="mailto:support@mobycomps.com">Email Support</a>
              </Button>
              <Button className="bg-[#8EE000] text-[#002D5C] hover:bg-[#8EE000]/90">
                <MessageSquare className="h-4 w-4 mr-2" />
                <a href="https://wa.me/4401234567890">Live Chat</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Mail and MessageSquare components
function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
