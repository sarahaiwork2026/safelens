let context: AudioContext | undefined;
export async function playAlertSound() {
  try {
    context ??= new AudioContext();
    await context.resume();
    for (const [index, frequency] of [880, 660].entries()) {
      const osc = context.createOscillator(),
        gain = context.createGain(),
        start = context.currentTime + index * 0.25;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + 0.24);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    }
  } catch (error) {
    if (error instanceof Error) console.info('Alert sound unavailable');
  }
}
