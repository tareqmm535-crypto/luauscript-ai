export class App {
  constructor() {
    this.apiKey = 'YOUR_OPENROUTER_API_KEY';
    this.model = 'openai/gpt-4o-mini';
    this.maxTokens = 2048;
    this.temperature = 0.7;
    this.conversation = [];
    this.scripts = JSON.parse(localStorage.getItem('luauScripts') || '[]');
    this.router = null;
  }

  init() {
    this.setupEditor();
    this.setupChat();
    this.loadTemplates();
    this.renderLibrary();
    this.initSettings();
    this.initSidebarTemplates();
  }

  setupEditor() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    if (!editor || !lineNumbers) return;

    const updateLines = () => {
      const lines = editor.value.split('\n').length;
      lineNumbers.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
    };

    editor.addEventListener('input', updateLines);
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        updateLines();
      }
    });
    updateLines();
  }

  setupChat() {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    sendBtn?.addEventListener('click', () => this.sendMessage());
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    if (!input || !messages || !input.value.trim()) return;

    const userMsg = input.value.trim();
    input.value = '';

    this.addMessage(messages, 'user', userMsg);
    this.conversation.push({ role: 'user', content: userMsg });

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.innerHTML = '<div class="message-avatar">🤖</div><div class="message-content"><div class="message-header">AI Assistant</div><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await this.callOpenRouter(this.conversation);
      if (response.error) throw new Error(response.error);

      const aiText = response.choices?.[0]?.message?.content || 'No response';
      this.conversation.push({ role: 'assistant', content: aiText });

      typingDiv.remove();
      this.addMessage(messages, 'ai', aiText);
      this.updatePreview(aiText);
    } catch (err) {
      typingDiv.remove();
      this.addMessage(messages, 'ai', '⚠️ Error: ' + err.message);
    }
    messages.scrollTop = messages.scrollHeight;
  }

  addMessage(container, role, text) {
    const div = document.createElement('div');
    div.className = 'message ' + role;
    div.innerHTML = '<div class="message-avatar">' + (role === 'user' ? '👤' : '🤖') + '</div><div class="message-content"><div class="message-header">' + (role === 'user' ? 'You' : 'AI Assistant') + '</div><div class="message-text">' + this.formatText(text) + '</div></div>';
    container.appendChild(div);
  }

  formatText(text) {
    return text
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  updatePreview(text) {
    const preview = document.getElementById('previewContent');
    if (!preview) return;
    const codeMatch = text.match(/```(?:luau|lua)?\n?([\s\S]*?)```/);
    if (codeMatch) {
      preview.textContent = codeMatch[1].trim();
    } else {
      preview.textContent = '-- ' + text.split('\n')[0].substring(0, 80) + '\n-- (Full response in chat)';
    }
  }

  async callOpenRouter(conversation) {
    // Try server proxy first (secure - API key on server)
    try {
      const proxyRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation,
          model: this.model,
          maxTokens: this.maxTokens,
          temperature: this.temperature
        })
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        return proxyData.data;
      }
    } catch(e) {
      // Server proxy failed, fall back to client-side
    }

    // Fallback: direct OpenRouter call
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.apiKey,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'LuauScript AI'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an expert Luau/Roblox Lua developer. Generate clean, efficient, well-commented Luau scripts. Always provide complete code. Explain briefly in English.' },
          ...conversation
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('API Error ' + response.status + ': ' + err);
    }
    return response.json();
  }

  loadTemplates() {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    const templates = [
      { name: 'Module Script', desc: 'Reusable module with functions', tags: ['module', 'oop'], code: '--[[\n\tModule Script Template\n]]\nlocal module = {}\n\nfunction module.new()\n\treturn setmetatable({}, { __index = module })\nend\n\nfunction module:init()\n\tprint("Module initialized")\nend\n\nreturn module' },
      { name: 'Remote Events Manager', desc: 'Handle client-server communication', tags: ['remote', 'networking'], code: 'local ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal remotes = Instance.new("Folder")\nremotes.Name = "Remotes"\nremotes.Parent = ReplicatedStorage\n\nlocal function createRemote(name, type)\n\tlocal remote = Instance.new(type)\n\tremote.Name = name\n\tremote.Parent = remotes\n\treturn remote\nend\n\nreturn { createRemote = createRemote }' },
      { name: 'Leaderboard System', desc: 'Player stats and leaderboard', tags: ['stats', 'leaderboard'], code: 'local DataStoreService = game:GetService("DataStoreService")\nlocal playerData = {}\n\nlocal function setupLeaderboard(player)\n\tlocal leaderstats = Instance.new("Folder")\n\tleaderstats.Name = "leaderstats"\n\tleaderstats.Parent = player\n\t\n\tlocal points = Instance.new("NumberValue")\n\tpoints.Name = "Points"\n\tpoints.Value = 0\n\tpoints.Parent = leaderstats\n\treturn points\nend\n\nreturn { setupLeaderboard = setupLeaderboard }' },
      { name: 'Tween Animation', desc: 'Smooth UI animations', tags: ['tween', 'ui', 'animation'], code: 'local TweenService = game:GetService("TweenService")\n\nlocal function animateObject(obj, properties, duration)\n\tlocal tweenInfo = TweenInfo.new(\n\t\tduration or 1,\n\t\tEnum.EasingStyle.Quad,\n\t\tEnum.EasingDirection.Out\n\t)\n\tlocal tween = TweenService:Create(obj, tweenInfo, properties)\n\ttween:Play()\n\treturn tween\nend\n\nreturn { animate = animateObject }' },
      { name: 'DataStore Module', desc: 'Save/load player data', tags: ['datastore', 'save'], code: 'local DataStoreService = game:GetService("DataStoreService")\nlocal store = DataStoreService:GetDataStore("PlayerData")\n\nlocal function saveData(playerId, data)\n\tlocal success, err = pcall(function()\n\t\tstore:SetAsync(playerId, data)\n\tend)\n\tif not success then warn("Save failed:", err) end\n\treturn success\nend\n\nlocal function loadData(playerId)\n\tlocal success, data = pcall(function()\n\t\treturn store:GetAsync(playerId)\n\tend)\n\tif success and data then return data end\n\treturn { points = 0, inventory = {} }\nend\n\nreturn { save = saveData, load = loadData }' },
      { name: 'Raycast Gun', desc: 'Shooting system with raycast', tags: ['gun', 'raycast', 'combat'], code: 'local rayParams = RaycastParams.new()\nrayParams.FilterType = Enum.RaycastFilterType.Blacklist\n\nlocal function shoot(origin, direction, ignoreList, range)\n\trayParams.FilterDescendantsInstances = ignoreList or {}\n\tlocal result = workspace:Raycast(origin, direction * (range or 500), rayParams)\n\t\n\tif result and result.Instance then\n\t\tlocal hit = result.Instance\n\t\tlocal damage = result.Instance:FindFirstChild("Damage")\n\t\tif damage then\n\t\t\thit:TakeDamage(damage.Value or 10)\n\t\tend\n\t\treturn result\n\tend\n\treturn nil\nend\n\nreturn { shoot = shoot }' },
      { name: 'Class System OOP', desc: 'Object-oriented class builder', tags: ['oop', 'class'], code: 'local Class = {}\nClass.__index = Class\n\nfunction Class:extend(name)\n\tlocal subclass = {}\n\tsubclass.__index = subclass\n\tsubclass.super = self\n\tsetmetatable(subclass, self)\n\tsubclass.name = name or "Class"\n\treturn subclass\nend\n\nfunction Class:new(...)\n\tlocal instance = setmetatable({}, self)\n\tinstance:init(...)\n\treturn instance\nend\n\nfunction Class:init(...) end\n\nreturn Class' },
      { name: 'Pathfinding AI', desc: 'NPC pathfinding movement', tags: ['ai', 'pathfinding', 'npc'], code: 'local PathfindingService = game:GetService("PathfindingService")\n\nlocal function moveToTarget(npc, targetPos)\n\tlocal path = PathfindingService:CreatePath()\n\tpath:ComputeAsync(npc.Position, targetPos)\n\t\n\tif path.Status == Enum.PathStatus.Success then\n\t\tlocal waypoints = path:GetWaypoints()\n\t\tfor _, waypoint in ipairs(waypoints) do\n\t\t\tnpc.Humanoid:MoveTo(waypoint.Position)\n\t\t\tnpc.Humanoid.MoveToFinished:Wait()\n\t\tend\n\tend\nend\n\nreturn { moveTo = moveToTarget }' },
      { name: 'GUI Drag System', desc: 'Draggable UI elements', tags: ['gui', 'drag', 'ui'], code: 'local UserInputService = game:GetService("UserInputService")\n\nlocal function makeDraggable(guiObject)\n\tlocal dragging, dragStart, startPos\n\t\n\tguiObject.InputBegan:Connect(function(input)\n\t\tif input.UserInputType == Enum.UserInputType.MouseButton1 then\n\t\t\tdragging = true\n\t\t\tdragStart = input.Position\n\t\t\tstartPos = guiObject.Position\n\t\tend\n\tend)\n\t\n\tguiObject.InputChanged:Connect(function(input)\n\t\tif dragging and input.UserInputType == Enum.UserInputType.MouseMovement then\n\t\t\tlocal delta = input.Position - dragStart\n\t\t\tguiObject.Position = UDim2.new(\n\t\t\t\tstartPos.X.Scale, startPos.X.Offset + delta.X,\n\t\t\t\tstartPos.Y.Scale, startPos.Y.Offset + delta.Y\n\t\t\t)\n\t\tend\n\tend)\n\t\n\tguiObject.InputEnded:Connect(function(input)\n\t\tif input.UserInputType == Enum.UserInputType.MouseButton1 then\n\t\t\tdragging = false\n\t\tend\n\tend)\nend\n\nreturn { makeDraggable = makeDraggable }' }
    ];

    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = '<h3>' + t.name + '</h3><p>' + t.desc + '</p><div class="template-tags">' + t.tags.map(tag => '<span class="template-tag">#' + tag + '</span>').join('') + '</div>';
      card.addEventListener('click', () => {
        document.getElementById('codeEditor').value = t.code;
        document.getElementById('lineNumbers').textContent = Array.from({length: t.code.split('\n').length}, (_, i) => i + 1).join('\n');
        document.getElementById('fileName').textContent = t.name.toLowerCase().replace(/\s+/g, '_') + '.luau';
        const output = document.getElementById('outputContent');
        output.innerHTML = '<div class="output-line"><span class="output-success">[SUCCESS]</span> Template loaded: ' + t.name + '</div>';
        this.saveScript(t.name, t.code);
        window.location.hash = '#editor';
      });
      grid.appendChild(card);
    });
  }

  renderLibrary() {
    const grid = document.getElementById('libraryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (this.scripts.length === 0) {
      grid.innerHTML = '<div class="empty-state">No saved scripts yet. Generate one with AI or use a template!</div>';
      return;
    }
    this.scripts.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'library-item';
      item.innerHTML = '<h4>' + s.name + '</h4><p>' + (s.date || '') + ' - ' + s.code.substring(0, 60) + '...</p>';
      item.addEventListener('click', () => {
        document.getElementById('codeEditor').value = s.code;
        document.getElementById('lineNumbers').textContent = Array.from({length: s.code.split('\n').length}, (_, i) => i + 1).join('\n');
        document.getElementById('fileName').textContent = s.name + '.luau';
        window.location.hash = '#editor';
      });
      grid.appendChild(item);
    });
  }

  saveScript(name, code) {
    this.scripts.unshift({ name, code, date: new Date().toLocaleString() });
    if (this.scripts.length > 20) this.scripts.pop();
    localStorage.setItem('luauScripts', JSON.stringify(this.scripts));
    this.renderLibrary();
  }

  initSettings() {
    const saved = JSON.parse(localStorage.getItem('luauSettings') || '{}');
    if (saved.apiKey) this.apiKey = saved.apiKey;
    if (saved.model) this.model = saved.model;
    if (saved.maxTokens) this.maxTokens = saved.maxTokens;
    if (saved.temperature !== undefined) this.temperature = saved.temperature;

    document.getElementById('apiKeyInput')?.addEventListener('input', (e) => {
      this.apiKey = e.target.value;
    });
    document.getElementById('toggleApiKey')?.addEventListener('click', () => {
      const input = document.getElementById('apiKeyInput');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('temperature')?.addEventListener('input', (e) => {
      this.temperature = parseFloat(e.target.value);
      document.getElementById('tempValue').textContent = this.temperature.toFixed(1);
    });
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      const settings = {
        apiKey: this.apiKey,
        model: document.getElementById('defaultModel')?.value || this.model,
        maxTokens: parseInt(document.getElementById('maxTokens')?.value) || this.maxTokens,
        temperature: this.temperature
      };
      this.model = settings.model;
      this.maxTokens = settings.maxTokens;
      localStorage.setItem('luauSettings', JSON.stringify(settings));
      document.getElementById('modelSelect').value = this.model;
      this.showToast('✅ Settings saved successfully');
    });
  }

  initSidebarTemplates() {
    document.querySelectorAll('.template-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const template = chip.dataset.template;
        const templates = document.querySelectorAll('#templatesGrid .template-card');
        if (templates.length > 0) {
          const idx = ['module', 'class', 'remote', 'tween', 'datastore'].indexOf(template);
          if (idx >= 0 && templates[idx]) templates[idx].click();
        }
      });
    });
  }

  showToast(msg, isError) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.classList.add('show');
    clearTimeout(toast._hide);
    toast._hide = setTimeout(() => toast.classList.remove('show'), 3000);
  }
}
