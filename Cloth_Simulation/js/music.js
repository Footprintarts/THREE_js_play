// music.js

export class BackgroundMusic {
  constructor(audioSrc) {
    this.audio = new Audio(audioSrc);
    this.audio.loop = true; // Loop the music continuously
    this.audio.volume = 0.5; // Set initial volume
  }

  // Method to play music
  play() {
    this.audio.play().catch((error) => {
      console.error("Music playback failed:", error);
    });
  }

  // Method to disable looping if needed
  noloop() {
    this.audio.loop = false; // Stop looping
  }

  // Method to pause music
  pause() {
    this.audio.pause();
  }

  // Method to stop and reset music
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0; // Reset to the start of the track
  }

  // Method to adjust volume
  setVolume(volume) {
    this.audio.volume = Math.min(1, Math.max(0, volume)); // Ensure volume is between 0 and 1
  }
}
