import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Ticket, Trophy, Truck, HelpCircle, AlarmClock, CreditCard } from "lucide-react";

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <section className="bg-[#002147] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How To Play</h1>
            <p className="text-xl max-w-3xl mx-auto text-gray-300">
              Participating in Moby Comps competitions is simple, transparent, and could lead to amazing prizes! Here's everything you need to know.
            </p>
          </div>
        </section>
        
        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002147] mb-4">Three Simple Steps</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our competition process is straightforward - just follow these three steps for your chance to win!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="bg-white rounded-lg shadow-md p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[80px] border-t-[#8EE000] border-r-[80px] border-r-transparent"></div>
                <span className="absolute top-3 left-4 text-[#002147] font-bold text-xl">1</span>
                
                <div className="mb-6 mt-6 flex justify-center">
                  <div className="p-4 rounded-full bg-[#002147]/10">
                    <Ticket className="h-10 w-10 text-[#002147]" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-[#002147] mb-3 text-center">Buy Tickets</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Browse our live competitions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Answer a simple question</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Choose your lucky ticket numbers</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Complete secure payment</span>
                  </li>
                </ul>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white rounded-lg shadow-md p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[80px] border-t-[#8EE000] border-r-[80px] border-r-transparent"></div>
                <span className="absolute top-3 left-4 text-[#002147] font-bold text-xl">2</span>
                
                <div className="mb-6 mt-6 flex justify-center">
                  <div className="p-4 rounded-full bg-[#002147]/10">
                    <AlarmClock className="h-10 w-10 text-[#002147]" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-[#002147] mb-3 text-center">Await the Draw</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>All draws occur on specified date</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Winners are chosen by automated system</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Results are published immediately</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Winners notified by email and text</span>
                  </li>
                </ul>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white rounded-lg shadow-md p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[80px] border-t-[#8EE000] border-r-[80px] border-r-transparent"></div>
                <span className="absolute top-3 left-4 text-[#002147] font-bold text-xl">3</span>
                
                <div className="mb-6 mt-6 flex justify-center">
                  <div className="p-4 rounded-full bg-[#002147]/10">
                    <Trophy className="h-10 w-10 text-[#002147]" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-[#002147] mb-3 text-center">Claim Your Prize</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Confirm your delivery details</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Choose between prize or cash alternative</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Receive your prize within 14 days</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#8EE000] mt-0.5 mr-2 flex-shrink-0" />
                    <span>Share your win story (optional)</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button asChild className="bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147]">
                <Link href="/competitions">Browse Competitions</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002147] mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about our competition process.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">How are winners selected?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  Winners are selected using an automated random number generator on the specified draw date. The entire process is fair, transparent, and verifiable.
                </p>
              </div>
              
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">Can I choose my ticket number?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  Yes! You can select your preferred available ticket numbers during checkout. You can also use our "Lucky Dip" feature to randomly select numbers for you.
                </p>
              </div>
              
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">How will I know if I've won?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  Winners are notified via email and SMS immediately after the draw. You can also check your account dashboard under "My Wins" to see if you've won.
                </p>
              </div>
              
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">What happens if I win?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  If you win, you'll receive detailed instructions on how to claim your prize. For most prizes, you'll need to confirm your delivery details and choose between the physical prize or cash alternative if available.
                </p>
              </div>
              
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">How long does delivery take?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  Most prizes are delivered within 14 working days of the draw date. For high-value or custom items, we may arrange a specific delivery date with you.
                </p>
              </div>
              
              {/* FAQ Item */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start mb-3">
                  <HelpCircle className="h-6 w-6 text-[#8EE000] mr-3 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-[#002147]">Are the competitions regulated?</h3>
                </div>
                <p className="text-gray-600 ml-9">
                  Yes, all Moby Comps competitions are conducted in accordance with UK gambling regulations. We have all necessary licenses and follow strict compliance procedures.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="border-[#002147] text-[#002147]">
                <Link href="/faqs">View All FAQs</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Testimonial Section */}
        <section className="py-16 bg-[#002147]/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002147] mb-4">What Our Winners Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Don't just take our word for it - here's what some of our recent winners have to say.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Testimonial */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-[#8EE000] rounded-full flex items-center justify-center text-[#002147] font-bold text-xl">
                    J
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-[#002147]">James T.</h4>
                    <p className="text-sm text-gray-500">Won a MacBook Pro</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "I couldn't believe it when I got the email saying I'd won! The MacBook arrived within a week and was exactly as described. The whole process was so smooth!"
                </p>
              </div>
              
              {/* Testimonial */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-[#8EE000] rounded-full flex items-center justify-center text-[#002147] font-bold text-xl">
                    S
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-[#002147]">Sarah L.</h4>
                    <p className="text-sm text-gray-500">Won £1,000 Cash</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "I've entered a few competitions but never expected to win. The money was in my account within 2 days of confirming my details. Will definitely keep entering!"
                </p>
              </div>
              
              {/* Testimonial */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-[#8EE000] rounded-full flex items-center justify-center text-[#002147] font-bold text-xl">
                    M
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-[#002147]">Mike B.</h4>
                    <p className="text-sm text-gray-500">Won a Gaming Console</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "This was my first time entering a competition like this. The process was so easy and transparent. When I won, I was kept updated every step of the way. Great experience!"
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-[#002147]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Try Your Luck?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              With tickets from just £1, amazing prizes, and transparent draws, there's never been a better time to enter!
            </p>
            <Button asChild size="lg" className="bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147]">
              <Link href="/competitions">Browse Competitions</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
