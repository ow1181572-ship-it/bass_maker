// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://njkiedsstvgrabtcqxlp.supabase.co';    // Replace with your Supabase Project URL
const SUPABASE_ANON_KEY = 'sb_publishable_PlRvZ-qXs9gJYu61TMJXbQ_4Gxr3rJP'; // Replace with your Supabase Anon Public Key

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==========================================
// BASS TUNER FREQUENCIES & PRESETS
// ==========================================

// Frequency definitions (in Hz) for bass notes
const frequencies = {
    'A0': 27.50,
    'B0': 30.87,
    'C1': 32.70,
    'D1': 36.71,
    'E1': 41.20,
    'F1': 43.65,
    'G1': 49.00,
    'A1': 55.00,
    'B1': 61.74,
    'C2': 65.41,
    'D2': 73.42,
    'E2': 82.41,
    'F2': 87.31,
    'G2': 98.00
};

// Preset tunings configurations
const tunings = {
    4: {
        standard: [{note: 'E1', string: 'E'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}, {note: 'G2', string: 'G'}],
        dropD:    [{note: 'D1', string: 'D'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}, {note: 'G2', string: 'G'}],
        lowC:     [{note: 'C1', string: 'C'}, {note: 'G1', string: 'G'}, {note: 'C2', string: 'C'}, {note: 'F2', string: 'F'}],
        lowB:     [{note: 'B0', string: 'B'}, {note: 'E1', string: 'E'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}]
    },
    5: {
        standard: [{note: 'B0', string: 'B'}, {note: 'E1', string: 'E'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}, {note: 'G2', string: 'G'}],
        dropD:    [{note: 'B0', string: 'B'}, {note: 'D1', string: 'D'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}, {note: 'G2', string: 'G'}],
        lowC:     [{note: 'C1', string: 'C'}, {note: 'G1', string: 'G'}, {note: 'C2', string: 'C'}, {note: 'F2', string: 'F'}, {note: 'A1', string: 'A'}],
        lowB:     [{note: 'A0', string: 'A0'}, {note: 'E1', string: 'E'}, {note: 'A1', string: 'A'}, {note: 'D2', string: 'D'}, {note: 'G2', string: 'G'}]
    }
};

// State
let currentStringCount = 4;
let currentPreset = 'standard';
let audioCtx = null;
let activeOscillator = null;

// DOM Elements
const stringsContainer = document.getElementById('stringsContainer');
const stringCountSelect = document.getElementById('stringCount');
const tuningPresetSelect = document.getElementById('tuningPreset');
const readoutFreq = document.getElementById('readoutFreq');
const readoutNote = document.getElementById('readoutNote');
const readoutStatus = document.getElementById('readoutStatus');

// Initialize Tuner View
function renderTuner() {
    stringsContainer.innerHTML = '';
    const currentList = tunings[currentStringCount][currentPreset] || tunings[currentStringCount]['standard'];

    currentList.forEach((item, index) => {
        const btn = document.createElement('div');
        btn.className = 'string-btn';
        const freq = frequencies[item.note] || 40.0;
        btn.innerHTML = `
            <div class="note-name">${item.note}</div>
            <div class="freq-label">${freq.toFixed(1)} Hz</div>
        `;
        btn.onclick = () => playTone(freq, item.note, btn);
        stringsContainer.appendChild(btn);
    });
}

// Web Audio Synth Play Tone
function playTone(freq, noteName, buttonEl) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (activeOscillator) {
        activeOscillator.stop();
        activeOscillator.disconnect();
    }

    document.querySelectorAll('.string-btn').forEach(b => b.classList.remove('active'));
    buttonEl.classList.add('active');

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle'; // Richer low end for bass
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.5);
    activeOscillator = osc;

    readoutFreq.textContent = `${freq.toFixed(2)} Hz`;
    readoutNote.textContent = `Target Pitch: ${noteName}`;
    readoutStatus.textContent = `Playing reference tone for ${noteName}...`;

    setTimeout(() => {
        buttonEl.classList.remove('active');
    }, 2500);
}

// Event Listeners for Tuner Controls
stringCountSelect.addEventListener('change', (e) => {
    currentStringCount = parseInt(e.target.value);
    renderTuner();
});

tuningPresetSelect.addEventListener('change', (e) => {
    currentPreset = e.target.value;
    renderTuner();
});


// ==========================================
// PRACTICE METRONOME LOGIC
// ==========================================
let metronomeInterval = null;
let isMetronomeRunning = false;
const bpmSlider = document.getElementById('bpmSlider');
const bpmValue = document.getElementById('bpmValue');
const toggleMetronomeBtn = document.getElementById('toggleMetronome');

bpmSlider.addEventListener('input', (e) => {
    bpmValue.textContent = e.target.value;
    if (isMetronomeRunning) {
        restartMetronome();
    }
});

function playClick() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function startMetronome() {
    const intervalMs = (60 / parseInt(bpmSlider.value)) * 1000;
    playClick();
    metronomeInterval = setInterval(playClick, intervalMs);
    isMetronomeRunning = true;
    toggleMetronomeBtn.textContent = 'Stop Metronome';
    toggleMetronomeBtn.style.background = 'var(--accent-amber)';
}

function stopMetronome() {
    clearInterval(metronomeInterval);
    isMetronomeRunning = false;
    toggleMetronomeBtn.textContent = 'Start Metronome';
    toggleMetronomeBtn.style.background = '';
}

function restartMetronome() {
    stopMetronome();
    startMetronome();
}

toggleMetronomeBtn.addEventListener('click', () => {
    if (isMetronomeRunning) stopMetronome();
    else startMetronome();
});


// ==========================================
// AUTHENTICATION MODAL & SUPABASE BACKEND
// ==========================================
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeAuthModal = document.getElementById('closeAuthModal');
const emailTabBtn = document.getElementById('emailTabBtn');
const phoneTabBtn = document.getElementById('phoneTabBtn');
const emailGroup = document.getElementById('emailGroup');
const phoneGroup = document.getElementById('phoneGroup');

// Replace your old handleAuthSubmit function with this updated one:
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    
    const isEmailActive = !document.getElementById('emailGroup').classList.contains('hidden');

    try {
        if (isEmailActive && email) {
            // Register user with Supabase Auth and pass full name into user_metadata
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;
            
            // Also save/sync a row in your public.profiles table with their name
            if (data.user) {
                await supabaseClient
                    .from('profiles')
                    .insert([{ id: data.user.id, name: fullName, email: email }]);
            }

            alert(`Success, ${fullName}! Check your email for confirmation.`);
        } else {
            // Insert profile record directly into your custom 'profiles' table with name & phone
            const { data, error } = await supabaseClient
                .from('profiles')
                .insert([{ name: fullName || null, email: email || null, phone: phone || null }]);

            if (error) throw error;
            alert(`Profile for ${fullName} successfully saved to Supabase!`);
        }

        authModal.classList.remove('active');
        document.getElementById('authForm').reset();
    } catch (error) {
        console.error('Supabase error:', error.message);
        alert('Database Error: ' + error.message);
    }
}// Replace your old handleAuthSubmit function with this updated one:
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    
    const isEmailActive = !document.getElementById('emailGroup').classList.contains('hidden');

    try {
        if (isEmailActive && email) {
            // Register user with Supabase Auth and pass full name into user_metadata
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;
            
            // Also save/sync a row in your public.profiles table with their name
            if (data.user) {
                await supabaseClient
                    .from('profiles')
                    .insert([{ id: data.user.id, name: fullName, email: email }]);
            }

            alert(`Success, ${fullName}! Check your email for confirmation.`);
        } else {
            // Insert profile record directly into your custom 'profiles' table with name & phone
            const { data, error } = await supabaseClient
                .from('profiles')
                .insert([{ name: fullName || null, email: email || null, phone: phone || null }]);

            if (error) throw error;
            alert(`Profile for ${fullName} successfully saved to Supabase!`);
        }

        authModal.classList.remove('active');
        document.getElementById('authForm').reset();
    } catch (error) {
        console.error('Supabase error:', error.message);
        alert('Database Error: ' + error.message);
    }
}
loginBtn.onclick = () => openAuth('login');
signupBtn.onclick = () => openAuth('signup');
closeAuthModal.onclick = () => authModal.classList.remove('active');

emailTabBtn.onclick = () => {
    emailTabBtn.classList.add('active');
    phoneTabBtn.classList.remove('active');
    emailGroup.classList.remove('hidden');
    phoneGroup.classList.add('hidden');
};

phoneTabBtn.onclick = () => {
    phoneTabBtn.classList.add('active');
    emailTabBtn.classList.remove('active');
    phoneGroup.classList.remove('hidden');
    emailGroup.classList.add('hidden');
};

// Backend-connected form submission handler
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    
    const isEmailActive = !document.getElementById('emailGroup').classList.contains('hidden');

    try {
        if (isEmailActive && email) {
            // Register or authenticate user via Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) throw error;
            alert('Success! Check your email for confirmation or login credentials.');
        } else {
            // Insert phone/email record directly into your Supabase 'profiles' database table
            const { data, error } = await supabaseClient
                .from('profiles')
                .insert([{ email: email || null, phone: phone || null }]);

            if (error) throw error;
            alert('Profile successfully saved to your Supabase database!');
        }

        authModal.classList.remove('active');
        document.getElementById('authForm').reset();
    } catch (error) {
        console.error('Supabase error:', error.message);
        alert('Database Error: ' + error.message);
    }
}


// ==========================================
// VIDEO LESSON MODAL LOGIC
// ==========================================
const videoModal = document.getElementById('videoModal');
const closeVideoModal = document.getElementById('closeVideoModal');
const videoIframe = document.getElementById('videoIframe');
const videoModalTitle = document.getElementById('videoModalTitle');

function openVideoModal(url, title) {
    videoModalTitle.textContent = title;
    videoIframe.src = url;
    videoModal.classList.add('active');
}

closeVideoModal.onclick = () => {
    videoModal.classList.remove('active');
    videoIframe.src = '';
};


// ==========================================
// INITIAL RENDER
// ==========================================
renderTuner();
