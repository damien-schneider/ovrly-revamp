import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  cameraStreamAtom,
  micLevelAtom,
  micVolumeAtom,
  screenStreamAtom,
  systemAudioVolumeAtom,
  systemLevelAtom,
} from "@/atoms/studio-atoms";

const ANALYSER_FFT_SIZE = 256;
const LEVEL_UPDATE_INTERVAL_MS = 50;

/** Compute RMS level from analyser time-domain data (0-1) */
function computeLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (const sample of data) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
}

export function useAudioMixer() {
  const cameraStream = useAtomValue(cameraStreamAtom);
  const screenStream = useAtomValue(screenStreamAtom);
  const micVolume = useAtomValue(micVolumeAtom);
  const systemVolume = useAtomValue(systemAudioVolumeAtom);
  const setMicLevel = useSetAtom(micLevelAtom);
  const setSystemLevel = useSetAtom(systemLevelAtom);

  const ctxRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const sysGainRef = useRef<GainNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sysSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const sysAnalyserRef = useRef<AnalyserNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  // Create/update audio graph when streams change
  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup is stable, only uses refs
  useEffect(() => {
    // If no audio sources, clean up
    const hasAudio =
      (cameraStream?.getAudioTracks().length ?? 0) > 0 ||
      (screenStream?.getAudioTracks().length ?? 0) > 0;

    if (!hasAudio) {
      cleanup();
      return;
    }

    // Create AudioContext if needed
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    // Create destination
    if (!destinationRef.current) {
      destinationRef.current = ctx.createMediaStreamDestination();
    }
    const destination = destinationRef.current;

    // Connect mic from camera stream
    if (cameraStream && cameraStream.getAudioTracks().length > 0) {
      // Disconnect old
      micSourceRef.current?.disconnect();

      const source = ctx.createMediaStreamSource(cameraStream);
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;

      gain.gain.value = micVolume;
      source.connect(gain);
      gain.connect(analyser);
      gain.connect(destination);

      micSourceRef.current = source;
      micGainRef.current = gain;
      micAnalyserRef.current = analyser;
    }

    // Connect system audio from screen share
    if (screenStream && screenStream.getAudioTracks().length > 0) {
      sysSourceRef.current?.disconnect();

      const source = ctx.createMediaStreamSource(screenStream);
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;

      gain.gain.value = systemVolume;
      source.connect(gain);
      gain.connect(analyser);
      gain.connect(destination);

      sysSourceRef.current = source;
      sysGainRef.current = gain;
      sysAnalyserRef.current = analyser;
    }

    mixedStreamRef.current = destination.stream;

    // Start VU meter polling
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (micAnalyserRef.current) {
        setMicLevel(computeLevel(micAnalyserRef.current));
      }
      if (sysAnalyserRef.current) {
        setSystemLevel(computeLevel(sysAnalyserRef.current));
      }
    }, LEVEL_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    cameraStream,
    screenStream,
    micVolume,
    systemVolume,
    setMicLevel,
    setSystemLevel,
  ]);

  // Update gain values reactively
  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.value = micVolume;
    }
  }, [micVolume]);

  useEffect(() => {
    if (sysGainRef.current) {
      sysGainRef.current.gain.value = systemVolume;
    }
  }, [systemVolume]);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    micSourceRef.current?.disconnect();
    sysSourceRef.current?.disconnect();
    micSourceRef.current = null;
    sysSourceRef.current = null;
    micGainRef.current = null;
    sysGainRef.current = null;
    micAnalyserRef.current = null;
    sysAnalyserRef.current = null;
    destinationRef.current = null;
    mixedStreamRef.current = null;
    if (ctxRef.current?.state !== "closed") {
      ctxRef.current?.close();
    }
    ctxRef.current = null;
    setMicLevel(0);
    setSystemLevel(0);
  };

  // Cleanup on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup runs once on unmount only
  useEffect(() => {
    return cleanup;
  }, []);

  return {
    mixedStream: mixedStreamRef.current,
  };
}
