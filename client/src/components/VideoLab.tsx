import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';
import {
  Video, Wand2, Download, RefreshCw, AlertTriangle, Sparkles,
  Loader2, Play, Settings2, Sliders, Film, Zap, Clock,
  Maximize2, Image, Palette, ChevronDown, Info, X
} from 'lucide-react';

interface VideoLabProps {
  isKeySelected: boolean;
  onOpenKeySelector: () => void;
}

const VideoLab: React.FC<VideoLabProps> = ({ isKeySelected, onOpenKeySelector }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState('cinematic');
  const [motion, setMotion] = useState('medium');

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    try {
      const url = await generateVideo(prompt, aspectRatio);
      setVideoUrl(url);
    } catch (err: any) {
      if (err.message?.includes('Requested entity was not found')) {
        onOpenKeySelector();
      } else {
        setError('Generation failed. Please check your project billing or API configuration.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const styles = [
    { id: 'cinematic', name: 'Cinematic', desc: 'Film-quality aesthetics' },
    { id: 'realistic', name: 'Realistic', desc: 'True to life rendering' },
    { id: 'animated', name: 'Animated', desc: '3D animation style' },
    { id: 'artistic', name: 'Artistic', desc: 'Expressive and stylized' },
  ];

  const aspectRatios = [
    { id: '9:16', name: 'Portrait', desc: 'Social media', icon: '📱' },
    { id: '16:9', name: 'Landscape', desc: 'YouTube', icon: '🖥️' },
    { id: '1:1', name: 'Square', desc: 'Instagram', icon: '⬜' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Film className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Video Lab</h1>
          </div>
          <p className="text-gray-400 text-sm ml-14">Professional AI video generation powered by Veo 3.1</p>
        </div>

        {!isKeySelected && (
          <button
            onClick={onOpenKeySelector}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-medium text-sm border border-amber-500/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Configure API
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex items-center gap-2 p-1 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] w-fit">
        <button
          onClick={() => setAdvancedMode(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !advancedMode
              ? 'bg-[#1a1a1a] text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Mode
          </div>
        </button>
        <button
          onClick={() => setAdvancedMode(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            advancedMode
              ? 'bg-[#1a1a1a] text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Advanced
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Prompt Input */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <label className="text-sm font-semibold text-white">Prompt</label>
              <div className="ml-auto text-xs text-gray-500">{prompt.length}/500</div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
              placeholder="Describe your video concept in detail... Be specific about scene, mood, camera movement, and visual style."
              className="w-full h-40 bg-black/50 border border-[#1a1a1a] rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-gray-200 resize-none placeholder-gray-600 text-sm leading-relaxed"
            />
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-xs text-gray-400 transition-all">
                🎬 Cinematic shot
              </button>
              <button className="px-3 py-1.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-xs text-gray-400 transition-all">
                🌅 Golden hour
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              <label className="text-sm font-semibold text-white">Format</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id as any)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    aspectRatio === ratio.id
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-black/50 border-[#1a1a1a] hover:border-[#2a2a2a]'
                  }`}
                >
                  <div className="text-2xl mb-1">{ratio.icon}</div>
                  <div className={`text-xs font-semibold ${aspectRatio === ratio.id ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {ratio.name}
                  </div>
                  <div className="text-[10px] text-gray-600">{ratio.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          {advancedMode && (
            <>
              {/* Style */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <label className="text-sm font-semibold text-white">Visual Style</label>
                </div>
                <div className="space-y-2">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`w-full p-3 rounded-xl border transition-all text-left ${
                        style === s.id
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-black/50 border-[#1a1a1a] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${style === s.id ? 'text-emerald-300' : 'text-gray-400'}`}>
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-600">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-green-400" />
                  <label className="text-sm font-semibold text-white">Duration</label>
                  <span className="ml-auto text-sm text-green-400 font-mono">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-2 bg-[#1a1a1a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>2s</span>
                  <span>10s</span>
                </div>
              </div>

              {/* Motion Intensity */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <label className="text-sm font-semibold text-white">Camera Motion</label>
                </div>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMotion(m)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        motion === m
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-black/50 border-[#1a1a1a] text-gray-500 hover:border-[#2a2a2a]'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Model Info */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Info className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-300 mb-1">Google Veo 3.1 Fast</div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Latest generation model with enhanced temporal consistency and photorealism
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt || !isKeySelected}
            className={`w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all ${
              generating || !prompt || !isKeySelected
                ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                : 'bg-emerald-400 text-black hover:bg-emerald-500 hover:scale-[1.02]'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Video
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Generation Failed</div>
                <div className="text-xs text-rose-400/70">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden h-full min-h-[600px] relative">
            {/* Preview Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-400">Preview Canvas</span>
                </div>
                {videoUrl && (
                  <div className="flex gap-2">
                    <a
                      href={videoUrl}
                      download="prolium-video.mp4"
                      className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white rounded-lg transition-all border border-[#2a2a2a]"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setVideoUrl(null)}
                      className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white rounded-lg transition-all border border-[#2a2a2a]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Content */}
            <div className="w-full h-full flex items-center justify-center p-8">
              {videoUrl ? (
                <div className="w-full max-w-2xl">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className={`w-full rounded-xl shadow-2xl ${
                      aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[600px] mx-auto' :
                      aspectRatio === '1:1' ? 'aspect-square' :
                      'aspect-video'
                    }`}
                  />
                  <div className="mt-4 p-4 bg-black/40 rounded-xl border border-[#1a1a1a]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Resolution</span>
                      <span className="text-white font-mono">1920x1080</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-400">Format</span>
                      <span className="text-white font-mono">{aspectRatio}</span>
                    </div>
                  </div>
                </div>
              ) : generating ? (
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-[#1a1a1a] border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <Film className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-xl font-semibold text-white">Generating your video</div>
                    <div className="text-sm text-gray-400">AI is processing your creative vision</div>
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <Play className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Create</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Describe your vision in the prompt field and click generate to bring your ideas to life with AI-powered video generation.
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="p-3 bg-black/40 rounded-xl border border-[#1a1a1a]">
                      <div className="text-2xl mb-1">🎬</div>
                      <div className="text-xs text-gray-500">Cinematic</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-[#1a1a1a]">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="text-xs text-gray-500">Fast</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-[#1a1a1a]">
                      <div className="text-2xl mb-1">✨</div>
                      <div className="text-xs text-gray-500">Quality</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLab;
