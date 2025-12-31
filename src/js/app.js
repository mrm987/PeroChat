/**
 * PeroChat - Y2K Retro Futurism Chatbot UI
 * Main Application JavaScript
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
  // Character image paths
  characters: {
    '나은': {
      default: 'assets/images/naeun_default.svg',
      happy: 'assets/images/naeun_default.svg',
      sad: 'assets/images/naeun_default.svg',
      angry: 'assets/images/naeun_default.svg',
    },
    '수아': {
      default: 'assets/images/sua_default.svg',
      happy: 'assets/images/sua_default.svg',
      sad: 'assets/images/sua_default.svg',
      angry: 'assets/images/sua_default.svg',
    },
  },

  // Event CG paths
  eventCGs: {
    'happy_ending': 'assets/images/cg_dramatic.svg',
    'sad_moment': 'assets/images/cg_dramatic.svg',
    'dramatic': 'assets/images/cg_dramatic.svg',
  },

  // Dialogue pattern: **CharacterName** | "dialogue"
  dialoguePattern: /\*\*(.+?)\*\*\s*\|\s*"(.+?)"/g,

  // Event markers in LLM response
  eventPattern: /\[EVENT:(\w+)\]/g,
  moodPattern: /\[MOOD:(\w+)\]/g,

  // Scroll behavior
  scrollThreshold: 0.5, // 50% visibility to be considered "active"
};

// ========================================
// State Management
// ========================================
const state = {
  currentMode: 'normal', // 'normal' or 'event'
  currentCharacters: [],
  currentMood: 'default',
  blocks: [],
  activeBlockIndex: 0,
  isTyping: false,
  lastCharacter: null,
};

// ========================================
// DOM Elements
// ========================================
const elements = {
  mainStage: null,
  visualLayer: null,
  textLayer: null,
  textContainer: null,
  characterContainer: null,
  userInput: null,
  btnSend: null,
  suggestions: null,
  mentalStatus: null,
  currentTime: null,
  inputContainer: null,
};

// ========================================
// Initialization
// ========================================
function init() {
  // Cache DOM elements
  elements.mainStage = document.getElementById('main-stage');
  elements.visualLayer = document.getElementById('visual-layer');
  elements.textLayer = document.getElementById('text-layer');
  elements.textContainer = document.getElementById('text-container');
  elements.characterContainer = document.getElementById('character-container');
  elements.userInput = document.getElementById('user-input');
  elements.btnSend = document.getElementById('btn-send');
  elements.suggestions = document.getElementById('suggestions');
  elements.mentalStatus = document.getElementById('mental-status');
  elements.currentTime = document.getElementById('current-time');
  elements.inputContainer = document.querySelector('.input-container');

  // Setup event listeners
  setupEventListeners();

  // Start time update
  updateTime();
  setInterval(updateTime, 1000);

  // Setup scroll observer
  setupScrollObserver();

  // Load demo content
  loadDemoContent();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
  // Send button click
  elements.btnSend.addEventListener('click', handleSend);

  // Enter key to send
  elements.userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Tab to skip typing animation
    if (e.key === 'Tab' && state.isTyping) {
      e.preventDefault();
      skipTyping();
    }

    // Escape to exit event mode
    if (e.key === 'Escape' && state.currentMode === 'event') {
      exitEventMode();
    }
  });
}

// ========================================
// Scroll Observer (Block Detection)
// ========================================
function setupScrollObserver() {
  const options = {
    root: elements.textContainer,
    rootMargin: '-40% 0px -40% 0px',
    threshold: [0, 0.5, 1],
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= CONFIG.scrollThreshold) {
        const block = entry.target;
        setActiveBlock(block);
      }
    });
  }, options);

  // Observe existing blocks
  document.querySelectorAll('.text-block').forEach((block) => {
    observer.observe(block);
  });

  // Store observer for later use
  state.scrollObserver = observer;
}

function setActiveBlock(block) {
  // Remove active class from all blocks
  document.querySelectorAll('.text-block').forEach((b) => {
    b.classList.remove('active');
  });

  // Add active class to current block
  block.classList.add('active');

  // Get block index
  const index = parseInt(block.dataset.index, 10);
  state.activeBlockIndex = index;

  // Update character display based on block data
  const characters = block.dataset.characters;
  if (characters) {
    const charList = characters.split(',').map((c) => c.trim());
    updateCharacterDisplay(charList);
  } else if (state.lastCharacter) {
    // If no character in this block, keep the last one
    updateCharacterDisplay([state.lastCharacter]);
  }

  // Check for event trigger
  const eventType = block.dataset.event;
  if (eventType && state.currentMode !== 'event') {
    enterEventMode(eventType);
  }
}

// ========================================
// Character Display
// ========================================
function updateCharacterDisplay(characters) {
  if (!characters || characters.length === 0) return;

  // Store last character
  state.lastCharacter = characters[characters.length - 1];
  state.currentCharacters = characters;

  const container = elements.characterContainer;

  // Handle multiple characters
  if (characters.length > 1) {
    container.classList.add('multiple');
  } else {
    container.classList.remove('multiple');
  }

  // Clear existing characters with fade out
  const existingImages = container.querySelectorAll('.character-image');
  existingImages.forEach((img) => {
    img.classList.add('fade-out');
    setTimeout(() => img.remove(), 300);
  });

  // Add new characters with fade in
  setTimeout(() => {
    characters.forEach((charName) => {
      const charConfig = CONFIG.characters[charName];
      if (charConfig) {
        const img = document.createElement('img');
        img.className = 'character-image fade-out';
        img.src = charConfig[state.currentMood] || charConfig.default;
        img.alt = charName;
        img.onerror = () => {
          // Fallback to placeholder if image not found
          img.src = createPlaceholderImage(charName);
        };
        container.appendChild(img);

        // Trigger fade in
        requestAnimationFrame(() => {
          img.classList.remove('fade-out');
          img.classList.add('fade-in');
        });
      } else {
        // Create placeholder for unknown character
        const img = document.createElement('img');
        img.className = 'character-image fade-in';
        img.src = createPlaceholderImage(charName);
        img.alt = charName;
        container.appendChild(img);
      }
    });
  }, 300);
}

function createPlaceholderImage(charName) {
  // Create a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="400" viewBox="0 0 200 400">
      <rect fill="#1A0033" width="200" height="400"/>
      <circle cx="100" cy="100" r="50" fill="#FF00FF" opacity="0.5"/>
      <rect x="60" y="170" width="80" height="150" rx="10" fill="#FF00FF" opacity="0.3"/>
      <text x="100" y="380" text-anchor="middle" fill="#00FFFF" font-family="sans-serif" font-size="16">${charName}</text>
    </svg>
  `;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ========================================
// Mode Switching
// ========================================
function enterEventMode(eventType) {
  state.currentMode = 'event';
  elements.mainStage.classList.remove('normal-mode');
  elements.mainStage.classList.add('event-mode');

  // Set event CG background if available
  const cgPath = CONFIG.eventCGs[eventType];
  if (cgPath) {
    const bgContainer = elements.visualLayer.querySelector('.bg-container');
    bgContainer.style.backgroundImage = `url(${cgPath})`;
  } else {
    // Use gradient background for events without CG
    const bgContainer = elements.visualLayer.querySelector('.bg-container');
    bgContainer.style.background = 'linear-gradient(135deg, #1A0033 0%, #330066 50%, #1A0033 100%)';
  }

  // Add visual feedback to input
  elements.inputContainer.classList.add('event-active');
  setTimeout(() => {
    elements.inputContainer.classList.remove('event-active');
  }, 500);
}

function exitEventMode() {
  state.currentMode = 'normal';
  elements.mainStage.classList.remove('event-mode');
  elements.mainStage.classList.add('normal-mode');

  // Reset background
  const bgContainer = elements.visualLayer.querySelector('.bg-container');
  bgContainer.style.backgroundImage = '';
  bgContainer.style.background = '';
}

// ========================================
// Text Parsing & Rendering
// ========================================
function parseResponse(responseText) {
  // Remove event/mood markers but capture them
  let events = [];
  let mood = 'default';

  responseText = responseText.replace(CONFIG.eventPattern, (match, eventType) => {
    events.push(eventType);
    return '';
  });

  responseText = responseText.replace(CONFIG.moodPattern, (match, moodType) => {
    mood = moodType;
    return '';
  });

  // Split into blocks (by dialogue)
  const blocks = [];
  let currentBlock = { characters: [], dialogues: [], narrations: [] };
  let lastDialogueIndex = -1;

  const lines = responseText.split('\n').filter((line) => line.trim());

  lines.forEach((line, index) => {
    const dialogueMatch = line.match(/\*\*(.+?)\*\*\s*\|\s*"(.+?)"/);

    if (dialogueMatch) {
      // If we already have content and this is a new character's dialogue, start a new block
      if (currentBlock.dialogues.length > 0) {
        blocks.push({ ...currentBlock });
        currentBlock = { characters: [], dialogues: [], narrations: [] };
      }

      const charName = dialogueMatch[1];
      const dialogue = dialogueMatch[2];

      currentBlock.characters.push(charName);
      currentBlock.dialogues.push({ character: charName, text: dialogue });
      lastDialogueIndex = index;
    } else {
      // This is narration
      currentBlock.narrations.push(line.trim());
    }
  });

  // Push the last block
  if (currentBlock.dialogues.length > 0 || currentBlock.narrations.length > 0) {
    blocks.push(currentBlock);
  }

  return { blocks, events, mood };
}

function renderBlocks(parsedBlocks, mood = 'default') {
  const { blocks, events } = parsedBlocks;

  // Update mood
  state.currentMood = mood;

  blocks.forEach((block, index) => {
    const blockEl = createBlockElement(block, state.blocks.length + index, events[0]);
    elements.textContainer.appendChild(blockEl);
    state.scrollObserver.observe(blockEl);
    state.blocks.push(block);
  });

  // Scroll to the first new block
  if (blocks.length > 0) {
    const firstNewBlock = elements.textContainer.querySelector(
      `.text-block[data-index="${state.blocks.length - blocks.length}"]`
    );
    if (firstNewBlock) {
      firstNewBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Trigger event mode if there are events
  if (events.length > 0) {
    enterEventMode(events[0]);
  }
}

function createBlockElement(block, index, eventType = null) {
  const blockEl = document.createElement('div');
  blockEl.className = 'text-block';
  blockEl.dataset.index = index;

  if (block.characters.length > 0) {
    blockEl.dataset.characters = block.characters.join(',');
  }

  if (eventType) {
    blockEl.dataset.event = eventType;
  }

  // Render dialogues
  block.dialogues.forEach((dialogue) => {
    const nameEl = document.createElement('span');
    nameEl.className = 'character-name';
    nameEl.textContent = dialogue.character;
    blockEl.appendChild(nameEl);

    const dialogueEl = document.createElement('span');
    dialogueEl.className = 'dialogue';
    dialogueEl.textContent = dialogue.text;
    blockEl.appendChild(dialogueEl);
  });

  // Render narrations
  block.narrations.forEach((narration) => {
    const narrationEl = document.createElement('p');
    narrationEl.className = 'narration';
    narrationEl.textContent = narration;
    blockEl.appendChild(narrationEl);
  });

  return blockEl;
}

function createUserBlock(message) {
  const blockEl = document.createElement('div');
  blockEl.className = 'text-block user-block';
  blockEl.dataset.index = state.blocks.length;

  const messageEl = document.createElement('div');
  messageEl.className = 'user-message';
  messageEl.textContent = message;
  blockEl.appendChild(messageEl);

  return blockEl;
}

// ========================================
// Typing Animation
// ========================================
function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'text-block typing-indicator';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  elements.textContainer.appendChild(indicator);
  indicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
  state.isTyping = true;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
  state.isTyping = false;
}

function skipTyping() {
  // Placeholder for skipping typing animation
  hideTypingIndicator();
}

// ========================================
// User Input Handling
// ========================================
function handleSend() {
  const message = elements.userInput.value.trim();
  if (!message || state.isTyping) return;

  // Clear input
  elements.userInput.value = '';

  // Add user message block
  const userBlock = createUserBlock(message);
  elements.textContainer.appendChild(userBlock);
  state.scrollObserver.observe(userBlock);
  state.blocks.push({ type: 'user', message });

  // Scroll to user message
  userBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Simulate LLM response (replace with actual API call)
  simulateLLMResponse(message);
}

function simulateLLMResponse(userMessage) {
  showTypingIndicator();

  // Simulate delay
  setTimeout(() => {
    hideTypingIndicator();

    // Demo responses based on user input
    let response = generateDemoResponse(userMessage);

    const parsed = parseResponse(response);
    renderBlocks(parsed, parsed.mood);
  }, 1500 + Math.random() * 1000);
}

function generateDemoResponse(userMessage) {
  // Simple demo response generator
  const responses = [
    {
      trigger: /안녕|하이|헬로/i,
      response: `**나은** | "...왔구나."

그녀는 창가에 기대선 채 고개만 살짝 돌렸다. 네온사인 불빛이 그녀의 옆얼굴을 붉게 물들이고 있었다.

**나은** | "기다렸어. 조금."

마지막 말은 거의 들리지 않을 정도로 작았다.`,
    },
    {
      trigger: /뭐해|뭐 해|뭘 해/i,
      response: `**나은** | "...그냥."

그녀는 손에 들린 핸드폰을 내려놓았다. 화면에는 아무것도 떠 있지 않았다.

**나은** | "너 생각. 하고 있었어."

담담하게 말했지만, 귀 끝이 살짝 붉어진 것을 숨기지 못했다.`,
    },
    {
      trigger: /좋아|사랑/i,
      response: `[EVENT:dramatic][MOOD:happy]
**나은** | "...뭐라고?"

그녀의 눈이 커졌다. 평소의 무표정이 완전히 무너져 내렸다.

**나은** | "다시 한번... 말해줄 수 있어?"

손이 미세하게 떨리고 있었다. 하지만 눈빛만은 똑바로 이쪽을 향하고 있었다.`,
    },
    {
      trigger: /싫어|미워/i,
      response: `[MOOD:sad]
**나은** | "...알았어."

그녀는 고개를 숙였다. 긴 머리카락이 표정을 가렸다.

**나은** | "그럴 줄 알았어. 어차피."

목소리가 떨렸다. 하지만 그녀는 끝까지 울지 않았다.`,
    },
    {
      trigger: /수아|둘|같이|함께/i,
      response: `문이 열리며 또 다른 인물이 들어왔다.

**수아** | "늦어서 미안!"

밝은 목소리가 방 안에 울렸다. 나은이 고개를 들어 그녀를 바라봤다.

**나은** | "...늦었잖아."

**수아** | "그래도 왔잖아. 안 온 것보다 낫지?"

수아가 환하게 웃으며 나은의 옆에 앉았다. 나은의 표정이 미묘하게 누그러졌다.`,
    },
    {
      trigger: /이벤트|테스트|CG/i,
      response: `[EVENT:dramatic]
갑자기 방 안의 공기가 달라졌다. 네온 불빛이 더욱 강렬하게 빛나기 시작했다.

**나은** | "...느껴져?"

그녀가 천천히 다가왔다. 심장 소리가 귓가에서 울렸다.

**나은** | "이 순간을. 기억해."

창밖의 비가 더욱 거세졌다.`,
    },
  ];

  // Find matching response
  for (const item of responses) {
    if (item.trigger.test(userMessage)) {
      return item.response;
    }
  }

  // Default response
  return `**나은** | "...그래?"

그녀는 잠시 생각에 잠겼다. 창밖을 바라보는 눈동자에 복잡한 감정이 스쳐 지나갔다.

**나은** | "무슨 말인지... 잘 모르겠어."

솔직한 고백이었다. 그녀는 가끔 이렇게 자신의 감정을 숨기지 않을 때가 있었다.`;
}

// ========================================
// Utility Functions
// ========================================
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  elements.currentTime.textContent = `${hours}:${minutes}`;
}

function updateMentalStatus(status) {
  const statuses = ['STABLE', 'UNSTABLE', 'CRITICAL', 'UNKNOWN'];
  if (statuses.includes(status)) {
    elements.mentalStatus.textContent = status;

    // Update color based on status
    const colors = {
      STABLE: '#00FF00',
      UNSTABLE: '#FF00FF',
      CRITICAL: '#FF0000',
      UNKNOWN: '#888888',
    };
    elements.mentalStatus.style.color = colors[status];
  }
}

function showSuggestions(suggestions) {
  elements.suggestions.innerHTML = '';
  elements.suggestions.classList.add('visible');

  suggestions.forEach((text) => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-btn';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      elements.userInput.value = text;
      handleSend();
      elements.suggestions.classList.remove('visible');
    });
    elements.suggestions.appendChild(btn);
  });
}

function hideSuggestions() {
  elements.suggestions.classList.remove('visible');
}

// ========================================
// Demo Content
// ========================================
function loadDemoContent() {
  const demoText = `창밖으로 비가 내렸다. 네온사인이 젖은 유리창에 번지며 방 안을 붉고 푸르게 물들였다.

**나은** | "...왔어?"

그녀는 창가에 서 있었다. 돌아보지 않은 채, 빗소리에 묻힐 듯한 목소리로 물었다.

**나은** | "오늘따라 비가 많이 오네."

손끝으로 유리창을 더듬었다. 차가운 표면 위로 빗방울이 흘러내렸다.`;

  const parsed = parseResponse(demoText);
  renderBlocks(parsed);

  // Activate first block and show initial character
  setTimeout(() => {
    const firstBlock = elements.textContainer.querySelector('.text-block');
    if (firstBlock) {
      firstBlock.classList.add('active');
      const characters = firstBlock.dataset.characters;
      if (characters) {
        updateCharacterDisplay(characters.split(','));
      }
    }
    showSuggestions(['안녕', '뭐 해?', '보고 싶었어']);
  }, 100);
}

// ========================================
// Start Application
// ========================================
document.addEventListener('DOMContentLoaded', init);
