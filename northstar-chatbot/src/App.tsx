import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  isEscalated?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello from the Northstar Support Assistant! Type an order number (e.g., ORD1001) to look up your return status.'
    }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setInput('');

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', userText.toUpperCase())
        .single();

      if (error || !data) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `Order "${userText}" not found. Please double-check your receipt number.`
          }
        ]);
        return;
      }

      const customerName = data.customer_name || 'Customer';
      const deliveryDateStr = data.delivery_date;
      const isEligible = data.return_eligible;
      const status = (data.status || 'Delivered').trim();

      // Check 1: Active/Pending Return Status
      if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('return')) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `Hello ${customerName}! Order ${data.order_number} already has an active return status ("${status}"). Automated returns cannot be re-submitted.`,
            isEscalated: true
          }
        ]);
        return;
      }

      // Check 2: Flagged Ineligible / Final Sale
      if (isEligible === false) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `Hello ${customerName}! Order ${data.order_number} is marked as Final Sale / Ineligible for automated returns.`,
            isEscalated: true
          }
        ]);
        return;
      }

      // Check 3: Date Evaluation (30-Day Window)
      if (deliveryDateStr) {
        const deliveryDate = new Date(deliveryDateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - deliveryDate.getTime());
        const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysElapsed <= 30) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'bot',
              text: `Hello ${customerName}! Your order was delivered ${daysElapsed} days ago (${deliveryDateStr}). Status: ${status}. Return APPROVED! Generating prepaid shipping label...`
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'bot',
              text: `Hello ${customerName}. Order ${data.order_number} was delivered ${daysElapsed} days ago (${deliveryDateStr}), which exceeds our 30-day return policy limit.`,
              isEscalated: true
            }
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: 'bot', text: `Hello ${customerName}! Order found, but delivery date is missing.` }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: 'Error connecting to database service.' }
      ]);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ margin: 0 }}>Northstar Support Chat</h2>
      </header>

      <div style={styles.chatWindow}>
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <div
              style={{
                ...styles.bubble,
                ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble)
              }}
            >
              {msg.text}
            </div>

            {/* Task 8: Escalation Card Component */}
            {msg.isEscalated && (
              <div style={styles.escalationCard}>
                <h4 style={{ margin: '0 0 8px 0', color: '#c53030' }}>⚠️ Return Exception Flagged</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4a5568' }}>
                  This request falls outside automated policy limits. Would you like to connect with a support agent for manual review?
                </p>
                <button
                  onClick={() => alert('Connecting to a live agent...')}
                  style={styles.escalateButton}
                >
                  Contact Human Agent
                </button>
              </div>
            )}
          </React.Fragment>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type an order number (e.g., ORD1001 or ORD1002)..."
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '500px',
    margin: '40px auto',
    height: '620px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ccc',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  header: {
    backgroundColor: '#0070f3',
    color: '#fff',
    padding: '16px',
    textAlign: 'center'
  },
  chatWindow: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f9f9f9'
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0070f3',
    color: '#fff',
    borderBottomRightRadius: '2px'
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
    color: '#000',
    borderBottomLeftRadius: '2px'
  },
  escalationCard: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    padding: '14px',
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '8px',
    marginTop: '4px'
  },
  escalateButton: {
    padding: '8px 14px',
    backgroundColor: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px'
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '14px'
  },
  button: {
    marginLeft: '8px',
    padding: '10px 18px',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};