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

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

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

const buildFileTree = (files) => {
  const root = { name: 'root', isDir: true, children: {}, path: '' };
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isDir: !isFile,
          children: {},
          path: parts.slice(0, i + 1).join('/'),
          fileId: isFile ? file.id : null
        };
      }
      current = current.children[part];
    }
  });
  
  return root;
};

const TreeNode = ({ node, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!node.isDir) {
    return (
      <div className="tree-file">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        <span className="file-name" title={node.name}>{node.name}</span>
        <button type="button" className="remove-file-btn" onClick={() => onRemove(node.fileId)} title="Remove file">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    );
  }

  const children = Object.values(node.children).sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });
  
  if (children.length === 0) return null;

  return (
    <div className="tree-folder">
      <div className="folder-header" onClick={() => setIsOpen(!isOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <span className="folder-name">{node.name}</span>
      </div>
      {isOpen && (
        <div className="folder-contents">
          {children.map(child => (
            <TreeNode key={child.path} node={child} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [model, setModel] = useState('meta/llama-3.2-11b-vision-instruct');
  const [chatList, setChatList] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if user is scrolled up from the bottom (with a 50px threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrolling.current = !isAtBottom;

    // Ignore small scrolls
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

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetchWithAuth('/chats');
      const data = await res.json();
      setChatList(data);
      if (data.length > 0 && !currentChatId) {
        selectChat(data[0].id);
      } else if (data.length === 0) {
        createNewChat();
      }
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetchWithAuth('/chats', { method: 'POST' });
      const data = await res.json();
      setChatList(prev => [data, ...prev]);
      selectChat(data.id);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  const selectChat = async (id) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setCurrentChatId(id);
    setLoading(false);
    try {
      const res = await fetchWithAuth(`/chats/${id}`);
      const data = await res.json();
      setMessages(data.messages.filter(m => m.role !== 'system'));
      setAttachedFiles(data.files || []);
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await fetchWithAuth(`/chats/${id}`, { method: 'DELETE' });
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
        setAttachedFiles([]);
      }
      fetchChats();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleFileSelect = async (e) => {
    if (!currentChatId) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setShowUploadModal(false);
    
    for (const file of files) {
      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = (ev) => reject(ev);
          reader.readAsText(file);
        });
        
        const res = await fetchWithAuth(`/chats/${currentChatId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            path: file.name,
            content: text
          })
        });
        const data = await res.json();
        setAttachedFiles(prev => [...prev, data]);
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
      }
    }
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.items) {
      const files = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          if (typeof item.webkitGetAsEntry === 'function') {
            const entry = item.webkitGetAsEntry();
            if (entry && entry.isFile) {
              files.push(item.getAsFile());
            }
          } else {
            // Fallback for browsers without webkitGetAsEntry
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      }
      if (files.length > 0) {
        handleFileSelect({ target: { files } });
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  };

  const removeFile = async (fileId) => {
    if (!currentChatId) return;
    try {
      await fetchWithAuth(`/chats/${currentChatId}/files/${fileId}`, { method: 'DELETE' });
      setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  const isUserScrolling = useRef(false);

  const scrollToBottom = () => {
    if (!isUserScrolling.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !currentChatId) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const botMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, botMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchWithAuth('/chat', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: currentChatId,
          model: model,
          message: userMessage.content
        }),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.error) throw new Error(data.error);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let accumulatedContent = '';
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.error) {
                    console.error("Error from API:", data.error);
                    accumulatedContent += `\n\n**API Error:** ${data.error}`;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = {
                          ...newMessages[newMessages.length - 1],
                          content: accumulatedContent
                      };
                      return newMessages;
                    });
                    break;
                  }
                  
                  if (data.reasoning || data.content) {
                      // Reasoning is hidden as requested
                      if (data.content) {
                          accumulatedContent += data.content;
                      }
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            ...newMessages[newMessages.length - 1],
                            content: accumulatedContent
                        };
                        return newMessages;
                      });
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks in buffer
                }
              }
            }
          }
        }
      }
      
      // Reset user scrolling lock when generation finishes
      isUserScrolling.current = false;
      fetchChats(); // Refresh sidebar title

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Error fetching chat:', error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: (newMessages[newMessages.length - 1].content || '') + `\n\n**Request Error:** ${error.message}`
          };
          return newMessages;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div 
      className="app-layout"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="global-drop-overlay">
          <div className="global-drop-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <h2>Drop files to upload</h2>
          </div>
        </div>
      )}
      <aside className={`sidebar glass-panel ${!isLeftSidebarOpen ? 'collapsed' : ''}`}>
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
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'var(--accent)', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
            Base Models
          </div>
          <Link to="/kimi" style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            Kimi K3
          </Link>
        </div>

        <div className="chat-list">
          {chatList.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-list-item ${currentChatId === chat.id ? 'active' : ''}`}
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
          <button className="toggle-sidebar-btn" onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} title="Toggle Sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="header-actions">
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="model-select"
              >
                <option value="meta/llama-3.2-11b-vision-instruct">Llama 3.2 11B Vision</option>
                <option value="meta/llama-3.2-90b-vision-instruct">Llama 3.2 90B Vision</option>
                <option value="nvidia/nemotron-3-super-120b-a12b">Nemotron 3 Super 120B</option>
                <option value="deepseek-ai/deepseek-v4-flash-0731">DeepSeek V4 Flash</option>
              </select>
            </div>
            <Link to="/kimi" style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧠</span> Switch to Kimi K3 (Vision)
            </Link>
            <button className="toggle-sidebar-btn" onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} title="Toggle Context">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            </button>
          </div>
        </header>

        <main className="chat-container" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4f46e5', marginBottom: '16px', opacity: 0.8 }}>
                <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
              </svg>
              <h2>Welcome to Anyon AI</h2>
              <p>Select a chat or start a new anonymous session.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className={`message-bubble ${msg.role}`}>
                    {msg.content && (
                      <div className="content-block markdown-body">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isMermaid = match && match[1] === 'mermaid';
                              const codeString = String(children).replace(/\n$/, '');
                              
                              if (!inline && isMermaid) {
                                return (
                                  <div className="code-block-wrapper mermaid-wrapper">
                                    <CodeCopyButton text={codeString} />
                                    <Mermaid chart={codeString} />
                                  </div>
                                );
                              }
                              
                              if (!inline && match) {
                                return (
                                  <div className="code-block-wrapper">
                                    <CodeCopyButton text={codeString} />
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </div>
                                );
                              }
                              
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {msg.role === 'assistant' && msg.content && (
                      <div className="bubble-actions">
                        <CopyButton text={msg.content} />
                      </div>
                    )}

                    {msg.role === 'assistant' && !msg.content && loading && idx === messages.length - 1 && (
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </main>

        <footer className={`input-area ${!isHeaderVisible ? 'hidden' : ''}`}>
          <div className="input-wrapper">
            <form onSubmit={handleSubmit} className="input-form glass-form">
              <div className="attachment-actions">
                <button type="button" className="attach-btn" onClick={() => setShowUploadModal(true)} title="Upload Files">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message the AI..."
                disabled={loading || !currentChatId}
                className="chat-input"
                rows="1"
              />
              {loading ? (
                <button type="button" onClick={handleStop} className="stop-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                  Stop
                </button>
              ) : (
                <button type="submit" disabled={!input.trim() || !currentChatId} className="send-btn">
                  Send
                </button>
              )}
            </form>
          </div>
        </footer>
      </div>
      
      <aside className={`right-sidebar glass-panel ${!isRightSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Context</h2>
        </div>
        <div className="file-tree-container">
          {attachedFiles.length === 0 ? (
            <div className="empty-tree">No files attached</div>
          ) : (
            Object.values(buildFileTree(attachedFiles).children)
              .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
              })
              .map(node => (
                <TreeNode key={node.path} node={node} onRemove={removeFile} />
              ))
          )}
        </div>
      </aside>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Content</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div 
              className={`drop-zone ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-icon-large">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <h4>Drag & Drop files here</h4>
              <p>or browse from your device</p>
              
              <div className="upload-options">
                <button className="upload-option-btn" onClick={() => fileInputRef.current?.click()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  Browse Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
