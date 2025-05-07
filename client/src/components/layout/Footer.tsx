import { Link } from "wouter";
import {
  Facebook,
  Instagram,
  Twitter,
  Twitch,
  CreditCard,
  CheckCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-white mb-4">
              <span className="text-secondary">MOBY</span>
              <span className="text-white">COMPS</span>
            </div>
            <p className="text-sm mb-4">
              The UK's most exciting prize competition platform. Win amazing prizes for as little as £1!
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Twitch className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="hover:text-secondary transition">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/competitions">
                  <a className="hover:text-secondary transition">Competitions</a>
                </Link>
              </li>
              <li>
                <Link href="/how-to-play">
                  <a className="hover:text-secondary transition">How to Play</a>
                </Link>
              </li>
              <li>
                <Link href="/my-entries">
                  <a className="hover:text-secondary transition">My Entries</a>
                </Link>
              </li>
              <li>
                <Link href="/my-wins">
                  <a className="hover:text-secondary transition">My Wins</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/competitions?category=Electronics">
                  <a className="hover:text-secondary transition">Electronics</a>
                </Link>
              </li>
              <li>
                <Link href="/competitions?category=Cash">
                  <a className="hover:text-secondary transition">Cash Prizes</a>
                </Link>
              </li>
              <li>
                <Link href="/competitions?category=Household">
                  <a className="hover:text-secondary transition">Household</a>
                </Link>
              </li>
              <li>
                <Link href="/competitions?category=Travel">
                  <a className="hover:text-secondary transition">Travel</a>
                </Link>
              </li>
              <li>
                <Link href="/competitions?category=Beauty">
                  <a className="hover:text-secondary transition">Beauty</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Help & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faqs">
                  <a className="hover:text-secondary transition">FAQs</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-secondary transition">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-secondary transition">Terms & Conditions</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-secondary transition">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/rules">
                  <a className="hover:text-secondary transition">Competition Rules</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">&copy; 2023 Moby Comps Ltd. All rights reserved.</p>
          </div>
          <div className="flex items-center">
            <span className="text-sm mr-4">Secure payments with:</span>
            <div className="flex space-x-3">
              <CreditCard className="h-6 w-6" />
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
