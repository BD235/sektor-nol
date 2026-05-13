import { Howl } from 'howler';

class SoundEngine {
  private ambientWind: Howl;
  private ambientHum: Howl;
  private ambientHeat: Howl;
  private clickSound: Howl;
  private alertSound: Howl;
  private discoverySound: Howl;
  private deathSound: Howl;
  private creatureSound: Howl;
  private startSound: Howl;

  constructor() {
    this.ambientWind = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2324/2324-preview.mp3'],
      loop: true,
      volume: 0.3,
    });

    this.ambientHum = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
      loop: true,
      volume: 0.15,
    });

    this.ambientHeat = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2507/2507-preview.mp3'], // Rumble/Heat haze sound
      loop: true,
      volume: 0.25,
    });

    this.clickSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
      volume: 0.5,
    });

    this.alertSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'],
      volume: 0.4,
    });

    this.discoverySound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'],
      volume: 0.5,
    });

    this.deathSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2533/2533-preview.mp3'],
      volume: 0.6,
    });

    this.creatureSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2141/2141-preview.mp3'],
      volume: 0.2,
    });

    this.startSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2550/2550-preview.mp3'],
      volume: 0.6,
    });
  }

  public startAmbience(planet: 'AETHELGARD' | 'IGNIS' = 'AETHELGARD') {
    if (planet === 'AETHELGARD') {
      if (!this.ambientWind.playing()) this.ambientWind.play();
      this.ambientHeat.stop();
    } else {
      if (!this.ambientHeat.playing()) this.ambientHeat.play();
      this.ambientWind.stop();
    }
    if (!this.ambientHum.playing()) this.ambientHum.play();
  }

  public stopAmbience() {
    this.ambientWind.stop();
    this.ambientHum.stop();
    this.ambientHeat.stop();
  }

  public playClick() {
    this.clickSound.play();
  }

  public playStart() {
    this.startSound.play();
  }

  public playAlert() {
    this.alertSound.play();
  }

  public playDiscovery() {
    this.discoverySound.play();
  }

  public playDeath() {
    this.deathSound.play();
  }

  public playCreature() {
    this.creatureSound.play();
  }
}

export const soundEngine = new SoundEngine();
