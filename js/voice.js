/*
 * BapuOP AI - Voice Module
 * Speech synthesis (Text-to-Speech) and Speech recognition (Speech-to-Text) frontend triggers
 */

(function () {
  let recognition = null;
  let isListening = false;

  function initSpeechToText(onResultCallback, onStateChangeCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      if (onStateChangeCallback) onStateChangeCallback(true);
    };

    recognition.onend = () => {
      isListening = false;
      if (onStateChangeCallback) onStateChangeCallback(false);
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      isListening = false;
      if (onStateChangeCallback) onStateChangeCallback(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResultCallback) onResultCallback(transcript);
    };

    return true;
  }

  function toggleListening() {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  }

  function speakText(text, voiceName = '') {
    if (!window.speechSynthesis) {
      console.warn('Speech Synthesis API is not supported in this browser.');
      return;
    }

    // Cancel current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name.includes(voiceName));
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  window.VoiceEngine = {
    initSTT: initSpeechToText,
    toggleSTT: toggleListening,
    speak: speakText,
    stop: stopSpeaking
  };
})();
