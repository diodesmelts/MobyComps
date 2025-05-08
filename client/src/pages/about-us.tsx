import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy, Shield, Check, Users, MapPin, Mail, Phone } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <section className="bg-[#002D5C] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl max-w-3xl mx-auto text-gray-300">
              Moby Comps is the UK's most transparent and exciting prize competition platform, offering affordable entries and life-changing prizes.
            </p>
          </div>
        </section>
        
        {/* Our Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#002D5C] mb-4">Our Story</h2>
                <div className="h-1 w-20 bg-[#C3DC6F] mx-auto"></div>
              </div>
              
              <div className="prose prose-lg mx-auto text-gray-700">
                <p>
                  Founded in 2022, Moby Comps was born from a simple idea: make premium products and experiences accessible to everyone through fun, affordable competitions. 
                </p>
                
                <p>
                  Our founder, a competition enthusiast himself, noticed that many existing platforms lacked transparency and customer focus. He set out to create a platform that prioritizes fair play, clear rules, and exceptional customer service.
                </p>
                
                <p>
                  Since our launch, we've awarded over 500 prizes worth more than £1 million to lucky winners across the UK. From cutting-edge electronics to dream vacations, luxury cars to life-changing cash prizes, we've helped make countless dreams come true.
                </p>
                
                <p>
                  Today, Moby Comps stands as one of the UK's most trusted competition platforms, with a growing community of over 50,000 active players. We're committed to maintaining the highest standards of integrity, transparency, and customer satisfaction in everything we do.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Values Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002D5C] mb-4">Our Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These core principles guide everything we do at Moby Comps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Value */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#C3DC6F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-[#002D5C]" />
                </div>
                <h3 className="text-xl font-semibold text-[#002D5C] mb-3">Fairness</h3>
                <p className="text-gray-600">
                  We conduct all competitions with complete fairness and transparency. Our automated draw system ensures every entry has an equal chance of winning.
                </p>
              </div>
              
              {/* Value */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#C3DC6F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-[#002D5C]" />
                </div>
                <h3 className="text-xl font-semibold text-[#002D5C] mb-3">Integrity</h3>
                <p className="text-gray-600">
                  We operate with the highest level of integrity, adhering to all gambling regulations and maintaining ethical standards across our business.
                </p>
              </div>
              
              {/* Value */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#C3DC6F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-[#002D5C]" />
                </div>
                <h3 className="text-xl font-semibold text-[#002D5C] mb-3">Community</h3>
                <p className="text-gray-600">
                  We foster a vibrant community of players who share excitement, support each other, and celebrate wins together.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How We're Different Section */}
        <section className="py-16 bg-[#002D5C]/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002D5C] mb-4">How We're Different</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                What sets Moby Comps apart from other competition platforms.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Transparent Draw Process</h3>
                  <p className="text-gray-600">
                    Our draw process is fully automated and auditable. We publish draw results immediately and notify all participants.
                  </p>
                </div>
              </div>
              
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Affordable Entry Points</h3>
                  <p className="text-gray-600">
                    With tickets starting from just £1, we make it possible for everyone to participate and win incredible prizes.
                  </p>
                </div>
              </div>
              
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Guaranteed Prize Delivery</h3>
                  <p className="text-gray-600">
                    Unlike some platforms, we guarantee prize delivery within 14 days of the draw or provide a cash alternative.
                  </p>
                </div>
              </div>
              
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Responsive Customer Support</h3>
                  <p className="text-gray-600">
                    Our dedicated support team responds to all queries within 24 hours, ensuring you always have assistance when needed.
                  </p>
                </div>
              </div>
              
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Limited Ticket Numbers</h3>
                  <p className="text-gray-600">
                    We limit the number of tickets for each competition, ensuring better odds compared to many other platforms.
                  </p>
                </div>
              </div>
              
              {/* Difference Item */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-[#C3DC6F]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#002D5C] mb-2">Cash Alternatives</h3>
                  <p className="text-gray-600">
                    We offer cash alternatives for all major prizes, giving winners flexibility in how they enjoy their winnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Team */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#002D5C] mb-4">Our Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Meet the dedicated professionals who make Moby Comps possible.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {/* Team Member */}
              <div className="text-center">
                <div className="w-32 h-32 bg-[#002D5C]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#002D5C]">JD</span>
                </div>
                <h3 className="text-lg font-semibold text-[#002D5C] mb-1">John Davis</h3>
                <p className="text-gray-600 text-sm">Founder & CEO</p>
              </div>
              
              {/* Team Member */}
              <div className="text-center">
                <div className="w-32 h-32 bg-[#002D5C]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#002D5C]">ST</span>
                </div>
                <h3 className="text-lg font-semibold text-[#002D5C] mb-1">Sarah Thompson</h3>
                <p className="text-gray-600 text-sm">Operations Director</p>
              </div>
              
              {/* Team Member */}
              <div className="text-center">
                <div className="w-32 h-32 bg-[#002D5C]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#002D5C]">MK</span>
                </div>
                <h3 className="text-lg font-semibold text-[#002D5C] mb-1">Michael King</h3>
                <p className="text-gray-600 text-sm">Marketing Manager</p>
              </div>
              
              {/* Team Member */}
              <div className="text-center">
                <div className="w-32 h-32 bg-[#002D5C]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#002D5C]">LP</span>
                </div>
                <h3 className="text-lg font-semibold text-[#002D5C] mb-1">Lisa Peterson</h3>
                <p className="text-gray-600 text-sm">Customer Support Lead</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="py-16 bg-[#002D5C]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Get In Touch</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Have questions or feedback? Our team is here to help!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Contact Method */}
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-[#C3DC6F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-[#002D5C]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
                <p className="text-gray-300">support@mobycomps.com</p>
                <p className="text-gray-300 text-sm mt-2">Responses within 24 hours</p>
              </div>
              
              {/* Contact Method */}
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-[#C3DC6F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-[#002D5C]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
                <p className="text-gray-300">0800 123 4567</p>
                <p className="text-gray-300 text-sm mt-2">Mon-Fri: 9am-5pm</p>
              </div>
              
              {/* Contact Method */}
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-[#C3DC6F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-[#002D5C]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Visit Us</h3>
                <p className="text-gray-300">123 Competition Street</p>
                <p className="text-gray-300">London, EC1V 9BX</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C]">
                <Link href="/competitions">Explore Our Competitions</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
