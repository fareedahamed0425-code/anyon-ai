import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import './index.css';
import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');

const fetchWithAuth = async (url, options = {}) => {
  const uid = auth.currentUser?.uid;
  const headers = { ...options.headers };
  if (uid) {
    headers['X-User-UID'] = uid;
  }
  const endpoint = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${endpoint}`;
  return fetch(fullUrl, { ...options, headers });
};

// Using the same helper components from the main app
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy response">
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

const CodeCopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

const Mermaid = ({ chart }) => {
  const [svg, setSvg] = useState('');
  const id = React.useId();
  const safeId = `mermaid-${id.replace(/:/g, '')}`;

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;
      try {
        const { svg: svgCode } = await mermaid.render(safeId, chart);
        setSvg(svgCode);
      } catch (e) {
        console.error("Mermaid parsing error", e);
        setSvg(`<div class="error">Error parsing mermaid diagram</div>`);
      }
    };
    renderChart();
  }, [chart]);

  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const KimiPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';

  const chatContainerRef = useRef(null);
  const userScrolledRef = useRef(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  const scrollToBottom = () => {
    if (!userScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    
    // If user scrolls up more than 50px from bottom, they are manually scrolling
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    userScrolledRef.current = !isNearBottom;

    // Header hide/show logic
    if (Math.abs(scrollTop - lastScrollY.current) < 5) return;

    if (scrollTop > lastScrollY.current && scrollTop > 60) {
      setIsHeaderVisible(false);
      window.dispatchEvent(new CustomEvent("headerVisibility", { detail: false }));
    } else {
      setIsHeaderVisible(true);
      window.dispatchEvent(new CustomEvent("headerVisibility", { detail: true }));
    }
    
    lastScrollY.current = scrollTop;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsHeaderVisible(true);
      window.dispatchEvent(new CustomEvent("headerVisibility", { detail: true }));
    }, 1500);
  };

  const fetchChats = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/chats`);
      const data = await res.json();
      setChatList(data);
      if (data.length > 0 && !chatId) {
        selectChat(data[0].id);
      } else if (data.length === 0) {
        createNewChat();
      }
    } catch (e) {
      console.error("Error fetching chats", e);
    }
  };

  useEffect(() => {
    fetchChats();
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        if (!isMobile) setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const createNewChat = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/chats`, { method: 'POST' });
      const data = await res.json();
      setChatList(prev => [data, ...prev]);
      selectChat(data.id);
    } catch (e) {
      console.error("Error creating chat", e);
    }
  };

  const selectChat = async (id) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setChatId(id);
    setIsLoading(false);
    try {
      const res = await fetchWithAuth(`${API_URL}/chats/${id}`);
      const data = await res.json();
      setMessages(data.messages.filter(m => m.role !== 'system'));
      setFiles(data.files || []);
    } catch (e) {
      console.error("Error selecting chat", e);
    }
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await fetchWithAuth(`${API_URL}/chats/${id}`, { method: 'DELETE' });
      if (chatId === id) {
        setChatId(null);
        setMessages([]);
        setFiles([]);
      }
      fetchChats();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      try {
        const res = await fetchWithAuth(`${API_URL}/chats/${chatId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, path: file.name, content })
        });
        const data = await res.json();
        setFiles(prev => [...prev, { ...data, content }]);
      } catch (err) {
        console.error("Failed to upload file", err);
      }
    };
    
    if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.pdf')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    e.target.value = null; // reset
  };

  const removeFile = async (fileId) => {
    try {
      await fetchWithAuth(`${API_URL}/chats/${chatId}/files/${fileId}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (e) {
      console.error("Failed to delete file", e);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || isLoading || !chatId) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning: '' }]);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchWithAuth(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({ 
          chat_id: chatId, 
          model: 'moonshotai/kimi-k3', 
          message: userMessage 
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              // Only remove images from file list if we want them to act like single-turn vision inputs.
              // We'll keep them to maintain context for followups if needed, but user can manually delete.
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = { ...newMessages[newMessages.length - 1] };
                if (data.error) {
                  lastMsg.content += `\n\n**Error:** ${data.error}`;
                }
                if (data.content) {
                  lastMsg.content += data.content;
                }
                if (data.reasoning) {
                  lastMsg.reasoning = (lastMsg.reasoning || '') + data.reasoning;
                }
                newMessages[newMessages.length - 1] = lastMsg;
                return newMessages;
              });
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Chat error", error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      fetchChats();
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (msg) => {
    const parts = msg.content.split(/(```mermaid\n[\s\S]*?\n```)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```mermaid')) {
        const chart = part.replace(/```mermaid\n/, '').replace(/\n```$/, '');
        return <Mermaid key={index} chart={chart} />;
      }
      return (
        <div className="content-block markdown-body">
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="code-block-container relative">
                    <div className="code-block-header">
                      <span className="code-language">{match[1]}</span>
                      <CodeCopyButton text={String(children).replace(/\n$/, '')} />
                    </div>
                    <pre className="code-block-pre">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className="app-layout">
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {/* Sidebar */}
      <aside className={`sidebar glass-panel ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a5b4fc', marginRight: '8px' }}>
              <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
            </svg>
            <h2>Anyon AI</h2>
          </div>
          <button className="new-chat-btn" onClick={createNewChat} title="Start a new conversation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New
          </button>
        </div>

        {/* Mode Selector in Sidebar */}
        <div style={{ padding: '0 12px 12px', display: 'flex', gap: '8px' }}>
          <Link to="/" style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            Base Models
          </Link>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'var(--accent)', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
            Kimi K3
          </div>
        </div>

        <div className="chat-list">
          {chatList.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-list-item ${chatId === chat.id ? 'active' : ''}`}
              onClick={() => selectChat(chat.id)}
            >
              <div className="chat-title">{chat.title}</div>
              <button className="delete-chat-btn" onClick={(e) => deleteChat(e, chat.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => auth.signOut()}
            style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', cursor: 'pointer', fontWeight: 500 }}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className={`glass-header ${!isHeaderVisible ? 'hidden' : ''}`}>
          <button className="toggle-sidebar-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle Sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span>🧠</span> {isMobile ? 'Kimi K3' : 'Kimi K3 Supercomputer (Vision)'}
            </div>
            <Link to="/" style={{ padding: '6px 12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              {isMobile ? '← Base' : '← Base Models'}
            </Link>
          </div>
        </header>

        <main className="chat-container" ref={chatContainerRef} onScroll={handleScroll}>
          <div className="messages-list" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '30px' }}>
            {messages.length === 0 ? (
              <div className="welcome" style={{ textAlign: 'center', marginTop: '20vh' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 600, background: 'linear-gradient(135deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>
                  Kimi K3 Supercomputer
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                  Upload images, PDFs, or any documents. Unrestricted capabilities and deep reasoning activated.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className={`message-bubble ${msg.role}`}>
                    {msg.reasoning && (
                      <details 
                        className={`thinking-animation ${(!isLoading || idx < messages.length - 1) ? 'done' : ''}`}
                      >
                        <summary>Deep Reasoning (Max Effort)</summary>
                        <div style={{ marginTop: '10px', color: '#9ca3af', fontSize: '0.95rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }} className="reasoning-content">
                          <ReactMarkdown>{msg.reasoning}</ReactMarkdown>
                        </div>
                      </details>
                    )}
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="markdown-content">
                        {renderMessageContent(msg)}
                      </div>
                    )}
                    
                    {msg.role === 'assistant' && msg.content && (
                      <div className="bubble-actions">
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="message-wrapper assistant typing-indicator">
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="input-area">
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {files.length > 0 && (
              <div className="attached-files" style={{ display: 'flex', gap: '10px', padding: '10px 15px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px 12px 0 0', overflowX: 'auto' }}>
                {files.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {f.content.startsWith('data:image/') && (
                      <img src={f.content} alt={f.name} style={{ width: '20px', height: '20px', borderRadius: '4px', marginLeft: '8px', objectFit: 'cover' }} />
                    )}
                    <button onClick={() => removeFile(f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '8px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="input-wrapper">
              <div className="input-form" style={{ borderRadius: files.length > 0 ? '0 0 24px 24px' : '24px', background: 'rgba(30, 30, 40, 0.9)' }}>
                <div className="attachment-actions" style={{ padding: '0 0 5px 5px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.txt,.csv,.json,.xml"
                  />
                  <button 
                    className="attach-btn" 
                    title="Attach File/Image"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  </button>
                </div>
                <textarea
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Kimi K3 anything... (Press Enter to send)"
                  rows={1}
                  style={{ padding: '12px 0', minHeight: '44px' }}
                />
                {isLoading ? (
                  <button type="button" onClick={handleStop} className="stop-btn" style={{ flexShrink: 0 }}>
                    Stop
                  </button>
                ) : (
                  <button 
                    className="send-btn" 
                    onClick={handleSend} 
                    disabled={(!input.trim() && files.length === 0)}
                    style={{ flexShrink: 0 }}
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default KimiPage;
