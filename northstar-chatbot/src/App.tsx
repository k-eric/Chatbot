import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client using your .env keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message>([
    { id: 1, sender: 'bot', text: 'Hello from the Northstar Support Assistant! Type an order number (e.g., ORD1001) to look up details.' }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    
    // 1. Add your message to the chat screen
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setInput('');

    // 2. Look up the order in the Supabase database
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', userText.toUpperCase()) // Handles lowercase inputs cleanly
        .single();

      if (error || !data) {
        setMessages((prev) => [...prev, { 
          id: Date.now(), 
          sender: 'bot', 
          text: `❌ No record found for order number "${userText}".` 
        }]);
      } else {
        const eligibility = data.return_eligible ? "✅ Eligible for return." : "❌ Non-Returnable.";
        const botResponse = `📦 Order details found!\n• Customer: ${data.customer_name}\n• Status: ${data.status}\n• Policy: ${eligibility}`;
        
        setMessages((prev) => [...prev, { id: Date.now(), sender: 'bot', text: botResponse }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'bot', text: '⚠️ Connection Error.' }]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 p-6 text-white flex flex-col justify-between hidden md:flex">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-indigo-400">Northstar Support</h1>
          <p className="text-xs text-slate-400 mt-1">Deflection Bot MVP v1.0</p>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full bg-white">
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <span className="font-semibold text-slate-800">Support Shield Automation</span>
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 font-medium">System Ready</span>
        </header>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an order number..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
            Send
          </button>
        </form>
      </main>
    </div>
  );
}