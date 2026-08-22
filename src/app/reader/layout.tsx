import { AudioPlayerProvider } from "@/features/audio-player/AudioPlayerProvider";

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return <AudioPlayerProvider>{children}</AudioPlayerProvider>;
}
