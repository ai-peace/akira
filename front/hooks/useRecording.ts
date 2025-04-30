import { useRef, useState } from 'react'
import { useCreateVoiceChat } from './resources/voice-chats/useCreateVoiceChat'
import { useVoiceChat } from './resources/voice-chats/useVoiceChat'

export const useRecording = (chatUniqueKey: string) => {
  const [isRecording, setIsRecording] = useState(false)
  // const [transcriptions, setTranscriptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const { createVoiceChatPromptGroup } = useVoiceChat({ uniqueKey: chatUniqueKey })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob)

        setIsProcessing(true)
        setError(null)
        try {
          const promptGroupEntity = await createVoiceChatPromptGroup(audioBlob)
          // const chatEntity = await createVoiceChat(audioBlob)
          // const prompt = promptGroupEntity?.prompts[0]
          // if (prompt) {
          // setTranscriptions((prev) => [...prev, prompt.result || ''])
          // }

          // setTranscriptions((prev) => [...prev, chatEntity.title || 'チャットです'])
          // return chatEntity
        } catch (error) {
          console.error('Error sending audio:', error)
          setError('音声の送信中にエラーが発生しました')
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('マイクへのアクセスに失敗しました')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  return {
    // transcriptions,
    error,
    isProcessing,
    isRecording,
    startRecording,
    stopRecording,
  }
}
