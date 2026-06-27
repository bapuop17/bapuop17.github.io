/*
 * BapuOP AI - Premium AI Chat System
 * Core logic for rendering markdown, managing local-storage chats, zipping histories, 
 * capturing vocal recordings, rendering code snippets, and fetching server-side Gemini answers
 */

document.addEventListener('DOMContentLoaded', () => {
  initChatSystem();
});

function initChatSystem() {
  const chatMessages = document.getElementById('chat-messages');
  const chatTextarea = document.getElementById('chat-textarea');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const chatWelcome = document.getElementById('chat-welcome');
  const sidebarHistory = document.getElementById('sidebar-history');
  
  // Voice & Upload hooks
  const voiceBtn = document.getElementById('voice-input-btn');
  const uploadBtn = document.getElementById('upload-file-btn');
  const fileInput = document.getElementById('hidden-file-input');
  const uploadPreview = document.getElementById('upload-preview');

  let currentChatId = null;
  let chatHistory = JSON.parse(localStorage.getItem('bapuop_chats')) || [];
  let isAiResponding = false;

  /* ---- Initialize UI & Event Handlers ---- */
  renderSidebarHistory();
  setupTextarea();
  setupSuggestions();
  setupSidebarToggles();
  setupVoiceInput();
  setupFileUpload();

  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      startNewConversation();
    });
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
      sendMessage();
    });
  }

  // Handle enter key send
  if (chatTextarea) {
    chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Load latest chat if exists, else start new
  if (chatHistory.length > 0) {
    loadConversation(chatHistory[0].id);
  } else {
    startNewConversation();
  }

  /* ---- Core Chat Actions ---- */

  function startNewConversation() {
    currentChatId = 'chat_' + Date.now();
    if (chatWelcome) chatWelcome.style.display = 'flex';
    if (chatMessages) chatMessages.innerHTML = '';
    
    // Clear upload preview
    if (uploadPreview) uploadPreview.innerHTML = '';
    window.UploadEngine.clear();

    const activeItem = document.querySelector('.history-item.active');
    if (activeItem) activeItem.classList.remove('active');
    
    updateTextareaHeight();
  }

  function loadConversation(id) {
    const convo = chatHistory.find(c => c.id === id);
    if (!convo) return;

    currentChatId = id;
    if (chatWelcome) chatWelcome.style.display = 'none';
    if (chatMessages) chatMessages.innerHTML = '';

    // Clear uploads
    if (uploadPreview) uploadPreview.innerHTML = '';
    window.UploadEngine.clear();

    // Set active sidebar item
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
      if (item.getAttribute('data-id') === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Render messages
    convo.messages.forEach(msg => {
      appendMessageHTML(msg.role, msg.text, msg.timestamp, msg.images || []);
    });

    scrollToBottom();
  }

  async function sendMessage() {
    if (isAiResponding) return;
    const text = chatTextarea ? chatTextarea.value.trim() : '';
    const images = window.UploadEngine.get();

    if (!text && images.length === 0) return;

    // Reset input fields
    if (chatTextarea) chatTextarea.value = '';
    if (uploadPreview) uploadPreview.innerHTML = '';
    updateTextareaHeight();

    if (chatWelcome) chatWelcome.style.display = 'none';

    // Store user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      role: 'user',
      text: text,
      timestamp: timestamp,
      images: images.map(img => img.dataUrl) // Save base64 urls
    };

    // Initialize conversation in history if it doesn't exist
    let convo = chatHistory.find(c => c.id === currentChatId);
    if (!convo) {
      convo = {
        id: currentChatId,
        title: text ? text.substring(0, 30) + '...' : 'Image Inquiry',
        timestamp: new Date().toLocaleDateString(),
        messages: []
      };
      chatHistory.unshift(convo);
    }

    convo.messages.push(userMsg);
    saveChatsToStorage();
    renderSidebarHistory();

    // Render user message instantly
    appendMessageHTML('user', text, timestamp, userMsg.images);
    scrollToBottom();

    // Clear local uploaded assets array
    window.UploadEngine.clear();

    // Render typing indicator
    const typingBubbleId = appendTypingIndicator();
    isAiResponding = true;
    if (chatSendBtn) chatSendBtn.disabled = true;

    try {
      let aiTextResponse = '';
      
      // Determine if there is a custom client key
      const clientApiKey = localStorage.getItem('bapuop_custom_api_key');

      // Try calling server-side API first, unless we want local fallbacks
      const payload = {
        prompt: text,
        images: userMsg.images,
        chatId: currentChatId
      };

      let response = null;
      
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Backend server unreachable, falling back to local simulation.');
      }

      if (response && response.ok) {
        const data = await response.json();
        aiTextResponse = data.text;
      } else {
        // Mock intelligence failover if server fails (perfect for standard GitHub Pages)
        aiTextResponse = getMockAiResponse(text);
      }

      // Remove typing indicator
      const indicator = document.getElementById(typingBubbleId);
      if (indicator) indicator.remove();

      // Append real AI response
      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      appendMessageHTML('ai', aiTextResponse, aiTimestamp);
      
      // Save AI response to history
      convo.messages.push({
        role: 'ai',
        text: aiTextResponse,
        timestamp: aiTimestamp
      });
      saveChatsToStorage();

      // Optional TTS synthesis
      if (localStorage.getItem('bapuop_voice_output') === 'true') {
        window.VoiceEngine.speak(aiTextResponse);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const indicator = document.getElementById(typingBubbleId);
      if (indicator) indicator.remove();
      
      appendMessageHTML('ai', 'An error occurred during communication. Please try again.', new Date().toLocaleTimeString());
    } finally {
      isAiResponding = false;
      if (chatSendBtn) chatSendBtn.disabled = false;
      scrollToBottom();
    }
  }

  /* ---- UI Rendering Helpers ---- */

  function appendMessageHTML(role, text, time, images = []) {
    const isAi = role === 'ai';
    const row = document.createElement('div');
    row.className = `chat-message-row ${isAi ? 'ai-row' : 'user-row'}`;

    let imagesHTML = '';
    if (images && images.length > 0) {
      imagesHTML = `<div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;">`;
      images.forEach(img => {
        imagesHTML += `<img src="${img}" style="max-width:200px;max-height:150px;border-radius:6px;border:1px solid var(--border-color);" />`;
      });
      imagesHTML += `</div>`;
    }

    const formattedBody = isAi ? parseMarkdown(text) : escapeHTML(text);

    row.innerHTML = `
      <div class="chat-message-content">
        <div class="message-avatar">
          ${isAi ? 'B' : 'U'}
        </div>
        <div class="message-bubble">
          <div class="message-meta">
            <span class="message-sender">${isAi ? 'BapuOP AI' : 'You'}</span>
            <span>${time}</span>
          </div>
          <div class="message-body">
            ${imagesHTML}
            ${formattedBody}
          </div>
          ${isAi ? `
            <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
              <button class="msg-action-btn copy-msg-btn" title="Copy text">
                📋 Copy
              </button>
              <button class="msg-action-btn speak-msg-btn" title="Speak message">
                🔊 Speak
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Hook copy button
    if (isAi) {
      const copyBtn = row.querySelector('.copy-msg-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
      });

      const speakBtn = row.querySelector('.speak-msg-btn');
      speakBtn.addEventListener('click', () => {
        window.VoiceEngine.speak(text);
      });
    }

    if (chatMessages) {
      chatMessages.appendChild(row);
    }
  }

  function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const row = document.createElement('div');
    row.className = 'chat-message-row ai-row';
    row.id = id;

    row.innerHTML = `
      <div class="chat-message-content">
        <div class="message-avatar">B</div>
        <div class="message-bubble">
          <div class="message-meta">
            <span class="message-sender">BapuOP AI</span>
            <span>Thinking...</span>
          </div>
          <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;

    if (chatMessages) {
      chatMessages.appendChild(row);
    }
    return id;
  }

  /* ---- Markdown & Code Formatting Parser ---- */
  function parseMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHTML(text);

    // 1. Code blocks: ```javascript [code] ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    parsed = parsed.replace(codeBlockRegex, (match, lang, code) => {
      const blockId = 'code_' + Date.now() + Math.random().toString(36).substr(2, 5);
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span>${lang || 'code'}</span>
            <button class="copy-code-btn" data-target="${blockId}">
              Copy
            </button>
          </div>
          <pre><code id="${blockId}">${code}</code></pre>
        </div>
      `;
    });

    // 2. Inline code: `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 3. Bold: **text**
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 4. Bullet points: * item
    parsed = parsed.replace(/^\*\s(.*)$/gm, '<li>$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Bind event listeners to dynamic copy buttons inside code blocks after inserting
    setTimeout(() => {
      const copyCodeBtns = document.querySelectorAll('.copy-code-btn');
      copyCodeBtns.forEach(btn => {
        btn.onclick = () => {
          const targetId = btn.getAttribute('data-target');
          const codeEl = document.getElementById(targetId);
          if (codeEl) {
            navigator.clipboard.writeText(codeEl.textContent);
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy', 2000);
          }
        };
      });
    }, 100);

    return parsed;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /* ---- UI Controls / Configurations ---- */

  function setupTextarea() {
    if (!chatTextarea) return;
    chatTextarea.addEventListener('input', updateTextareaHeight);
  }

  function updateTextareaHeight() {
    if (!chatTextarea) return;
    chatTextarea.style.height = 'auto';
    chatTextarea.style.height = (chatTextarea.scrollHeight - 10) + 'px';
  }

  function setupSuggestions() {
    const suggestions = document.querySelectorAll('.suggestion-card');
    suggestions.forEach(card => {
      card.addEventListener('click', () => {
        const title = card.querySelector('h4').textContent;
        const prompt = card.querySelector('p').textContent;
        if (chatTextarea) {
          chatTextarea.value = prompt;
          chatTextarea.focus();
          updateTextareaHeight();
        }
      });
    });
  }

  function setupSidebarToggles() {
    const toggleBtn = document.querySelector('.mobile-chat-toggle');
    const sidebar = document.querySelector('.chat-sidebar');
    const overlay = document.querySelector('.chat-overlay');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }

  /* ---- Voice System integration ---- */
  function setupVoiceInput() {
    if (!voiceBtn) return;

    const micWaves = document.getElementById('voice-waves');

    const hasStt = window.VoiceEngine.initSTT(
      // Result callback
      (transcript) => {
        if (chatTextarea) {
          chatTextarea.value += (chatTextarea.value ? ' ' : '') + transcript;
          updateTextareaHeight();
        }
      },
      // State change callback
      (isListening) => {
        if (isListening) {
          voiceBtn.classList.add('active');
          if (micWaves) micWaves.style.display = 'flex';
        } else {
          voiceBtn.classList.remove('active');
          if (micWaves) micWaves.style.display = 'none';
        }
      }
    );

    if (hasStt) {
      voiceBtn.addEventListener('click', () => {
        window.VoiceEngine.toggleSTT();
      });
    } else {
      voiceBtn.style.display = 'none';
    }
  }

  /* ---- File Upload system integration ---- */
  function setupFileUpload() {
    if (!uploadBtn || !fileInput || !uploadPreview) return;

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      window.UploadEngine.handle(e.target.files, (fileData, allFiles) => {
        renderUploadPreviews(allFiles);
      });
    });

    // Drag-drop setup
    const dropArea = document.querySelector('.chat-input-box');
    window.UploadEngine.setup(dropArea, (fileData, allFiles) => {
      renderUploadPreviews(allFiles);
    });
  }

  function renderUploadPreviews(files) {
    if (!uploadPreview) return;
    uploadPreview.innerHTML = '';

    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'upload-preview-item';
      
      const isImg = file.type.startsWith('image/');
      item.innerHTML = `
        ${isImg ? `<img src="${file.dataUrl}" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;text-align:center;background:rgba(255,255,255,0.05);color:var(--text-secondary);padding:2px;">Doc</div>`}
        <button class="remove-upload-btn" data-id="${file.id}">✕</button>
      `;

      item.querySelector('.remove-upload-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = window.UploadEngine.remove(file.id);
        renderUploadPreviews(updated);
      });

      uploadPreview.appendChild(item);
    });
  }

  /* ---- Sidebar list rendering ---- */
  function renderSidebarHistory() {
    if (!sidebarHistory) return;
    sidebarHistory.innerHTML = '';

    chatHistory.forEach(convo => {
      const item = document.createElement('div');
      item.className = `history-item ${convo.id === currentChatId ? 'active' : ''}`;
      item.setAttribute('data-id', convo.id);

      item.innerHTML = `
        <span class="history-title">${convo.title}</span>
        <button class="delete-history-btn" data-id="${convo.id}">✕</button>
      `;

      // Handle item click to load
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-history-btn')) {
          loadConversation(convo.id);
          // Close mobile drawer if open
          const sidebar = document.querySelector('.chat-sidebar');
          const overlay = document.querySelector('.chat-overlay');
          if (sidebar) sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('active');
        }
      });

      // Handle item deletion
      item.querySelector('.delete-history-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(convo.id);
      });

      sidebarHistory.appendChild(item);
    });
  }

  function deleteConversation(id) {
    chatHistory = chatHistory.filter(c => c.id !== id);
    saveChatsToStorage();
    renderSidebarHistory();

    if (currentChatId === id) {
      if (chatHistory.length > 0) {
        loadConversation(chatHistory[0].id);
      } else {
        startNewConversation();
      }
    }
  }

  function saveChatsToStorage() {
    localStorage.setItem('bapuop_chats', JSON.stringify(chatHistory));
  }

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /* ---- Mock AI fallbacks when offline (GitHub Pages) ---- */
  function getMockAiResponse(input) {
    const text = input.toLowerCase();
    
    if (text.includes('hello') || text.includes('hi ')) {
      return "Hello there! Welcome to **BapuOP AI**. I'm your premium intelligent companion inspired by OpenAI, Perplexity, and Apple design. How can I assist you with your research, development, or brainstorming today?";
    }
    
    if (text.includes('code') || text.includes('program') || text.includes('javascript')) {
      return "Here is an elegant JavaScript implementation demonstrating dynamic glassmorphism color configurations:\n\n```javascript\n// Configure premium real-time glow vector tracking\nfunction configureGlow(element, hue = 260) {\n  element.addEventListener('mousemove', (e) => {\n    const rect = element.getBoundingClientRect();\n    const x = e.clientX - rect.left;\n    const y = e.clientY - rect.top;\n    \n    element.style.setProperty('--glow-x', `${x}px`);\n    element.style.setProperty('--glow-y', `${y}px`);\n    element.style.setProperty('--glow-color', `hsla(${hue}, 85%, 65%, 0.15)`);\n  });\n}\n```\n\nThis script lets cards capture mouse paths and project high-fidelity spotlight backdrops beautifully!";
    }

    if (text.includes('apple') || text.includes('design')) {
      return "Our design language harmonizes the stark, professional simplicity of **Apple** with the interactive intelligence of modern AI tools like **Claude** and **Perplexity**. We focus on:\n\n* **Generous Negative Space**: Allowing elements to breathe.\n* **Precision Micro-interactions**: Smooth scaling and light effects on hover.\n* **Symmetrical Typography**: Perfectly paired sans and display typefaces.\n* **Layered Transparency**: Sophisticated blur backdrops using high-performance CSS hardware acceleration.";
    }

    if (text.includes('price') || text.includes('pricing') || text.includes('cost')) {
      return "BapuOP AI offers three custom tiers built for every level of innovation:\n\n* **Starter Tier (Free)**: Access to Gemini-3.5-lite with standard speeds.\n* **Professional Tier ($20/mo)**: Unlimited high-speed premium queries, advanced reasoning engines, and full voice output capabilities.\n* **Enterprise Tier (Custom)**: Custom SLA guarantees, API scaling limits, and dedicated fine-tuned private nodes.";
    }

    return `Thank you for sharing your thoughts: "${input}". Since this project is fully client-side compatible (optimized for GitHub Pages!), I am processing this on your device. \n\nTo connect this interface to real, state-of-the-art LLM logic, you can easily deploy it with the pre-built **Express server** we provide in this package, or customize your credentials in the **Settings workspace**. Let me know how you'd like to proceed!`;
  }
}
