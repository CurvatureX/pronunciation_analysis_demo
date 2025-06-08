"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertCircle,
  Star,
  Brain,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface PronunciationScore {
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
}

interface WordFeedback {
  word: string;
  score: number;
  feedback: string;
  position: number;
}

interface AnalysisResult {
  detectedText: string;
  userTranscript: string;
  scores: PronunciationScore;
  wordFeedback: WordFeedback[];
  audioUrl?: string;
  rawApiResponse?: any;
  aiAnalysis?: string;
  error?: string;
}

export default function PronunciationAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  // Remove target sentence - Azure will detect what was spoken automatically
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock waveform data for visualization
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        // Simulate audio level changes
        setAudioLevel(Math.random() * 100);
        // Simulate waveform data
        setWaveformData((prev) => prev.map(() => Math.random() * 100));
      }, 100);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Azure prefers 16kHz
          channelCount: 1, // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Check if WAV format is supported, otherwise use the best available
      let mimeType = "audio/wav";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Try other formats that we can convert
        const supportedTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
          "audio/mpeg",
        ];

        mimeType =
          supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) ||
          "audio/webm";
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        // Convert to WAV if not already in WAV format
        let finalBlob = audioBlob;
        if (!mimeType.includes("wav")) {
          try {
            finalBlob = await convertToWav(audioBlob);
          } catch (conversionError) {
            console.warn(
              "WAV conversion failed, using original format:",
              conversionError
            );
          }
        }

        const audioUrl = URL.createObjectURL(finalBlob);
        setRecordedAudio(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to record audio.");
    }
  };

  // Function to convert audio to WAV format
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const fileReader = new FileReader();

      fileReader.onload = async () => {
        try {
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Convert to 16kHz mono WAV
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  // Function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Convert audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }

    return arrayBuffer;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      audioRef.current = new Audio(recordedAudio);
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setRecordedAudio(null);
    setAnalysisResult(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setWaveformData(Array(40).fill(0));
  };

  const analyzeRecording = async () => {
    if (!recordedAudio) return;

    setIsAnalyzing(true);

    try {
      // Azure Speech Service configuration from environment variables
      const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
      const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

      if (!speechKey || !speechRegion) {
        throw new Error(
          "Azure Speech Service not configured. Please set NEXT_PUBLIC_AZURE_SPEECH_KEY and NEXT_PUBLIC_AZURE_SPEECH_REGION in your .env.local file."
        );
      }

      // Convert audio URL to ArrayBuffer
      const response = await fetch(recordedAudio);
      const audioBlob = await response.blob();
      const audioBuffer = await audioBlob.arrayBuffer();

      // Create Azure Speech SDK configuration
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        speechKey,
        speechRegion
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      // Create push audio input stream for better browser compatibility
      const pushStream = SpeechSDK.AudioInputStream.createPushStream();

      // Write the audio data to the stream
      pushStream.write(audioBuffer);
      pushStream.close();

      // Create audio configuration from the push stream
      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

      // Configure pronunciation assessment for unscripted assessment
      // Empty string enables automatic speech detection without reference text
      const pronunciationAssessmentConfig =
        new SpeechSDK.PronunciationAssessmentConfig(
          "", // Empty reference text for unscripted assessment
          SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
          SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
          false // enableMiscue
        );

      // Create speech recognizer
      const speechRecognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );

      // Apply pronunciation assessment configuration
      pronunciationAssessmentConfig.applyTo(speechRecognizer);

      // Perform pronunciation assessment
      const result = await new Promise<SpeechSDK.SpeechRecognitionResult>(
        (resolve, reject) => {
          speechRecognizer.recognizeOnceAsync(
            (result: SpeechSDK.SpeechRecognitionResult) => {
              speechRecognizer.close();
              resolve(result);
            },
            (error: string) => {
              speechRecognizer.close();
              reject(new Error(error));
            }
          );
        }
      );

      // Check if recognition was successful
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        // Get pronunciation assessment result
        const pronunciationResult =
          SpeechSDK.PronunciationAssessmentResult.fromResult(result);

        // Get detailed JSON result
        const detailedResultJson = result.properties.getProperty(
          SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
        );
        const detailedResult = JSON.parse(detailedResultJson);

        // Transform Azure result to our format
        const baseAnalysisResult: AnalysisResult = {
          detectedText: result.text, // Azure automatically detected what was spoken
          userTranscript: result.text,
          scores: {
            overall: Math.round(pronunciationResult.pronunciationScore || 0),
            accuracy: Math.round(pronunciationResult.accuracyScore || 0),
            fluency: Math.round(pronunciationResult.fluencyScore || 0),
            completeness: Math.round(
              pronunciationResult.completenessScore || 0
            ),
          },
          wordFeedback:
            detailedResult.NBest?.[0]?.Words?.map(
              (word: any, index: number) => ({
                word: word.Word,
                score: Math.round(
                  word.PronunciationAssessment?.AccuracyScore || 0
                ),
                feedback: generateFeedback(
                  word.PronunciationAssessment?.AccuracyScore,
                  word.PronunciationAssessment?.ErrorType
                ),
                position: index,
              })
            ) || [],

          audioUrl: recordedAudio,
          rawApiResponse: detailedResult, // Include raw Azure response for JSON display
        };

        // 先设置基础结果
        setAnalysisResult(baseAnalysisResult);

        // 然后调用DeepSeek AI分析
        setIsAiAnalyzing(true);
        try {
          const aiResponse = await fetch("/api/ai-analysis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              azureResponse: detailedResult,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            if (aiData.success && aiData.analysis) {
              // 更新结果，包含AI分析
              setAnalysisResult((prev) =>
                prev
                  ? {
                      ...prev,
                      aiAnalysis: aiData.analysis,
                    }
                  : baseAnalysisResult
              );
            }
          }
        } catch (aiError) {
          console.warn("AI analysis failed:", aiError);
          // AI分析失败不影响主要功能，继续使用基础结果
        } finally {
          setIsAiAnalyzing(false);
        }
      } else {
        throw new Error(
          `Speech recognition failed: ${SpeechSDK.ResultReason[result.reason]}`
        );
      }
    } catch (error) {
      console.error("Analysis error:", error);
      // Fallback to mock data if Azure fails
      const mockResult: AnalysisResult = {
        detectedText: "Azure Error - Using mock data",
        userTranscript: "Azure Error - Using mock data",
        scores: {
          overall: 85,
          accuracy: 82,
          fluency: 88,
          completeness: 85,
        },
        wordFeedback: [
          {
            word: "Azure",
            score: 50,
            feedback: "Check Azure Speech Service configuration",
            position: 0,
          },
          {
            word: "Error:",
            score: 50,
            feedback: error instanceof Error ? error.message : "Unknown error",
            position: 1,
          },
        ],

        audioUrl: recordedAudio,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      setAnalysisResult(mockResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to generate feedback based on score and error type
  const generateFeedback = (score: number, errorType: string): string => {
    if (errorType === "Omission") return "Word was not pronounced";
    if (errorType === "Insertion") return "Extra word detected";
    if (errorType === "Mispronunciation")
      return "Pronunciation needs improvement";

    if (score >= 90) return "Excellent pronunciation";
    if (score >= 80) return "Good pronunciation";
    if (score >= 70) return "Acceptable, could be clearer";
    if (score >= 60) return "Needs improvement";
    return "Significant improvement needed";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI Pronunciation Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Record your speech and let Azure AI automatically detect what you
            said and analyze your pronunciation. No target sentence needed -
            just speak naturally!
          </p>
        </motion.div>

        {/* Recording Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="feedback-card mb-8"
        >
          <div className="text-center">
            {/* Recording Status */}
            <div className="mb-6">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center mb-4"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full recording-pulse mr-2"></div>
                  <span className="text-red-600 font-medium">
                    Recording: {formatTime(Math.floor(recordingTime / 10))}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Waveform Visualization */}
            {(isRecording || recordedAudio) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-end justify-center space-x-1 mb-6 h-16"
              >
                {waveformData.map((height, index) => (
                  <motion.div
                    key={index}
                    className="waveform-bar"
                    style={{
                      height: `${Math.max(4, height * 0.6)}px`,
                      width: "4px",
                      opacity: isRecording ? 1 : 0.5,
                    }}
                    animate={{
                      height: isRecording
                        ? `${Math.max(4, height * 0.6)}px`
                        : "4px",
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!isRecording ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="flex items-center px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors shadow-lg"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Recording
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="flex items-center px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-lg"
                >
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop Recording
                </motion.button>
              )}

              {recordedAudio && !isRecording && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isPlaying ? pausePlayback : playRecording}
                    className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-full font-medium hover:bg-gray-600 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="mr-2 h-4 w-4" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetRecording}
                    className="flex items-center px-4 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-colors"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={analyzeRecording}
                    disabled={isAnalyzing}
                    className="flex items-center px-6 py-3 bg-accent-500 text-white rounded-full font-medium hover:bg-accent-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Pronunciation"
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Detected Text */}
              <div className="feedback-card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Volume2 className="mr-2 h-5 w-5 text-blue-500" />
                  Detected Speech
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-lg text-gray-800 italic">
                    "{analysisResult.detectedText}"
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    This is what Azure Speech Service automatically detected
                    from your pronunciation
                  </p>
                </div>
              </div>

              {/* Overall Scores */}
              <div className="feedback-card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Star className="mr-2 h-5 w-5 text-yellow-500" />
                  Pronunciation Scores
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(analysisResult.scores).map(([key, score]) => (
                    <div
                      key={key}
                      className={`text-center p-4 rounded-lg ${getScoreBgColor(
                        score
                      )}`}
                    >
                      <div
                        className={`text-2xl font-bold ${getScoreColor(score)}`}
                      >
                        {score}%
                      </div>
                      <div className="text-sm font-medium text-gray-600 capitalize">
                        {key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Word-by-Word Feedback */}
              <div className="feedback-card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Word Analysis
                </h3>
                <div className="space-y-3">
                  {analysisResult.wordFeedback.map((word, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        <span className="font-medium text-lg mr-3">
                          "{word.word}"
                        </span>
                        <span
                          className={`text-sm font-bold ${getScoreColor(
                            word.score
                          )}`}
                        >
                          {word.score}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {word.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              {(isAiAnalyzing || analysisResult.aiAnalysis) && (
                <div className="feedback-card">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-purple-500" />
                    AI 口语老师的专业建议
                    <Sparkles className="ml-2 h-4 w-4 text-yellow-500" />
                    {isAiAnalyzing && (
                      <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    )}
                  </h3>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
                    {isAiAnalyzing ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3"></div>
                        <span className="text-purple-700 font-medium">
                          AI老师正在分析您的发音，请稍候...
                        </span>
                      </div>
                    ) : analysisResult.aiAnalysis ? (
                      <div className="prose prose-sm max-w-none">
                        <div
                          className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                          style={{ fontSize: "16px", lineHeight: "1.6" }}
                        >
                          {analysisResult.aiAnalysis}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 flex items-center">
                    <Brain className="mr-1 h-3 w-3" />
                    {isAiAnalyzing
                      ? "正在生成个性化指导..."
                      : "由 DeepSeek AI 提供的个性化指导"}
                  </div>
                </div>
              )}

              {/* Raw JSON Response */}
              <div className="feedback-card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2 text-purple-500 font-mono">{`{}`}</span>
                  Backend Response (JSON)
                </h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(
                      analysisResult.rawApiResponse || analysisResult,
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  This shows the raw JSON response from the pronunciation
                  analysis API
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
