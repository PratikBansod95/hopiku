import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SfxManager } from "@services/SfxManager";

class MockGainNode {
  gain = {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = {};
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  }));
  createOscillator = vi.fn(() => ({
    type: "sine",
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createBuffer = vi.fn(() => ({
    getChannelData: () => new Float32Array(8),
  }));
  createBiquadFilter = vi.fn(() => ({
    type: "lowpass",
    frequency: { value: 220 },
    connect: vi.fn(),
  }));
  currentTime = 0;
  sampleRate = 44100;
  decodeAudioData = vi.fn(async () => ({}));
}

describe("SfxManager", () => {
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    vi.stubGlobal("window", {
      AudioContext: vi.fn(() => mockCtx),
    });
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => mockCtx),
    );
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for unlock before playing the first sound", async () => {
    const sfx = new SfxManager();
    sfx.playTap();

    await vi.waitFor(() => {
      expect(mockCtx.resume).toHaveBeenCalled();
    });
  });

  it("resumes audio when re-enabled after mute", async () => {
    const sfx = new SfxManager();
    sfx.playTap();

    await vi.waitFor(() => {
      expect(mockCtx.resume).toHaveBeenCalled();
    });

    sfx.setEnabled(false);
    expect(mockCtx.suspend).toHaveBeenCalled();

    mockCtx.resume.mockClear();
    sfx.setEnabled(true);

    await vi.waitFor(() => {
      expect(mockCtx.resume).toHaveBeenCalled();
    });
  });
});
