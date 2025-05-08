import { Link } from "wouter";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#002D5C] text-white border-t-4 border-[#C3DC6F] mt-8">
      <div className="container mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Moby Comps</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Moby Comps offers exciting prize competitions with amazing prizes at affordable ticket prices. We're committed to transparency, with clear rules and automated, fair draws.
            </p>
            <div className="mt-4 flex space-x-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/competitions?category=electronics" className="hover:text-[#C3DC6F]">Electronics</Link></li>
              <li><Link href="/competitions?category=travel" className="hover:text-[#C3DC6F]">Travel</Link></li>
              <li><Link href="/competitions?category=cash_prizes" className="hover:text-[#C3DC6F]">Cash Prizes</Link></li>
              <li><Link href="/competitions?category=household" className="hover:text-[#C3DC6F]">Household</Link></li>
              <li><Link href="/competitions?category=beauty" className="hover:text-[#C3DC6F]">Beauty</Link></li>
              <li><Link href="/competitions?category=family" className="hover:text-[#C3DC6F]">Family</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/how-to-play" className="hover:text-[#C3DC6F]">How to Play</Link></li>
              <li><Link href="/faqs" className="hover:text-[#C3DC6F]">FAQs</Link></li>
              <li><Link href="/about-us" className="hover:text-[#C3DC6F]">About Us</Link></li>
              <li><Link href="/terms" className="hover:text-[#C3DC6F]">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-[#C3DC6F]">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-[#C3DC6F]">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#C3DC6F] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@mobycomps.com</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#C3DC6F] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>0800 123 4567</span>
              </li>
              <li>
                <div className="mt-4">
                  <div className="text-[#C3DC6F] mb-2">Secure payments with</div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-white rounded px-2 py-1">
                      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="36" height="24" rx="4" fill="white"/>
                        <path d="M13.384 15.774H11.078L12.626 8.2H14.932L13.384 15.774Z" fill="#00579F"/>
                        <path d="M20.897 8.344C20.438 8.158 19.701 7.954 18.784 7.954C16.693 7.954 15.201 9.068 15.192 10.667C15.183 11.871 16.251 12.539 17.058 12.952C17.886 13.374 18.15 13.642 18.15 14.01C18.141 14.585 17.471 14.844 16.845 14.844C15.964 14.844 15.495 14.693 14.739 14.345L14.43 14.208L14.095 16.232C14.643 16.492 15.648 16.715 16.693 16.725C18.916 16.725 20.375 15.629 20.394 13.91C20.404 12.96 19.851 12.210 18.605 11.601C17.849 11.208 17.38 10.94 17.38 10.553C17.39 10.202 17.773 9.843 18.614 9.843C19.321 9.825 19.833 10.014 20.224 10.202L20.441 10.312L20.776 8.343L20.897 8.344Z" fill="#00579F"/>
                        <path d="M23.989 8.2H22.178C21.731 8.2 21.386 8.335 21.188 8.822L18.423 15.772H20.646C20.646 15.772 20.98 14.898 21.06 14.686H23.698C23.76 14.952 23.936 15.772 23.936 15.772H25.935L23.989 8.2ZM21.622 13.005C21.805 12.522 22.558 10.679 22.558 10.679C22.548 10.698 22.743 10.211 22.855 9.908L22.996 10.603C22.996 10.603 23.44 12.606 23.532 13.005H21.622Z" fill="#00579F"/>
                        <path d="M10.245 8.2L8.15 13.42L7.954 12.604C7.592 11.47 6.393 10.23 5.026 9.573L6.949 15.763H9.192L12.477 8.2H10.245Z" fill="#00579F"/>
                        <path d="M6.13 8.2H2.696L2.65 8.407C5.546 9.111 7.515 10.723 8.315 12.605L7.609 8.823C7.494 8.344 7.149 8.209 6.702 8.2H6.13Z" fill="#FAA61A"/>
                      </svg>
                    </div>
                    <div className="bg-white rounded px-2 py-1">
                      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="36" height="24" rx="4" fill="white"/>
                        <path d="M22.5 19.5H13.5V4.5H22.5V19.5Z" fill="#FF5F00"/>
                        <path d="M14.145 12C14.145 9.1035 15.51 6.5325 17.625 4.875C16.002 3.6 13.9335 2.8965 11.718 2.8965C6.1845 2.8965 1.6875 7.0365 1.6875 12C1.6875 16.9635 6.1845 21.1035 11.718 21.1035C13.9335 21.1035 16.002 20.4 17.625 19.125C15.51 17.505 14.145 14.898 14.145 12Z" fill="#EB001B"/>
                        <path d="M34.3125 12C34.3125 16.9635 29.8155 21.1035 24.282 21.1035C22.0665 21.1035 19.998 20.4 18.375 19.125C20.5275 17.5035 21.855 14.898 21.855 12C21.855 9.1035 20.49 6.5325 18.375 4.875C19.998 3.6 22.0665 2.8965 24.282 2.8965C29.8155 2.8965 34.3125 7.0725 34.3125 12Z" fill="#F79E1B"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-[#002D5C]/80 py-4 text-sm">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Moby Comps Ltd. All rights reserved. UK Registered Company No. 12345678</p>
          <p className="mt-1">All competitions are conducted in accordance with UK gambling regulations.</p>
        </div>
      </div>
    </footer>
  );
}
