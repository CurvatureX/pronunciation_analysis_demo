import { NextRequest, NextResponse } from 'next/server'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

interface PronunciationAssessmentRequest {
  audioData: string // Base64 encoded audio
  referenceText: string
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const { audioData, referenceText, language = 'en-US' }: PronunciationAssessmentRequest = await request.json()

    if (!audioData || !referenceText) {
      return NextResponse.json(
        { error: 'Missing required fields: audioData and referenceText' },
        { status: 400 }
      )
    }

    // Azure Speech Service configuration
    const speechKey = process.env.AZURE_SPEECH_KEY
    const speechRegion = process.env.AZURE_SPEECH_REGION

    if (!speechKey || !speechRegion) {
      return NextResponse.json(
        { error: 'Azure Speech Service not configured. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in your .env.local file.' },
        { status: 500 }
      )
    }

    // Real Azure Speech Service implementation
    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64')

    // Create speech config
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion)
    speechConfig.speechRecognitionLanguage = language

    // Create push audio input stream for better compatibility
    const pushStream = sdk.AudioInputStream.createPushStream()
    
    // Write audio data to stream
    pushStream.write(audioBuffer)
    pushStream.close()
    
    // Create audio config from push stream
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream)

    // Configure pronunciation assessment
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      false // Enable miscue detection - hardcoded to false
    )
    
    // Note: Prosody assessment configuration will be handled by Azure automatically
    // if it's supported in your Speech Service tier

    // Create speech recognizer
    const speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
    
    // Apply pronunciation assessment config
    pronunciationAssessmentConfig.applyTo(speechRecognizer)

    // Perform pronunciation assessment
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      speechRecognizer.recognizeOnceAsync(
        (result: sdk.SpeechRecognitionResult) => {
          speechRecognizer.close()
          resolve(result)
        },
        (error: string) => {
          speechRecognizer.close()
          reject(new Error(error))
        }
      )
    })

    // Check if recognition was successful
    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
      // Get pronunciation assessment result
      const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result)
      
      // Get detailed JSON result
      const detailedResult = result.properties.getProperty(
        sdk.PropertyId.SpeechServiceResponse_JsonResult
      )

      // Parse the detailed result
      const parsedResult = JSON.parse(detailedResult)

      // Format response
      const response = {
        success: true,
        recognizedText: result.text,
        pronunciationAssessment: {
          accuracyScore: pronunciationResult.accuracyScore,
          fluencyScore: pronunciationResult.fluencyScore,
          completenessScore: pronunciationResult.completenessScore,
          pronunciationScore: pronunciationResult.pronunciationScore,
          prosodyScore: pronunciationResult.prosodyScore || 0
        },
        words: parsedResult.NBest?.[0]?.Words?.map((word: any) => ({
          word: word.Word,
          accuracyScore: word.PronunciationAssessment?.AccuracyScore,
          errorType: word.PronunciationAssessment?.ErrorType,
          phonemes: word.Phonemes?.map((phoneme: any) => ({
            phoneme: phoneme.Phoneme,
            accuracyScore: phoneme.PronunciationAssessment?.AccuracyScore
          }))
        })) || [],
        detailedResult: parsedResult
      }

      return NextResponse.json(response)
    } else {
      return NextResponse.json(
        { 
          error: 'Speech recognition failed',
          reason: sdk.ResultReason[result.reason],
          details: result.errorDetails
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Pronunciation assessment error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during pronunciation assessment',
        details: error instanceof Error ? error.message : 'Unknown error',
        note: 'Check your Azure Speech Service configuration'
      },
      { status: 500 }
    )
  }
} 