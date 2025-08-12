import React, { useState } from 'react';
import { Box, HStack, Input, IconButton, Tooltip } from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Mic } from 'lucide-react';

function InputBar({ onSend }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [instruction, setInstruction] = useState('');

  const handleSend = () => {
    onSend(text);
    setText('');
  };

  const handleMic = async () => {
    setRecording(true);
    setInstruction('Listening... Speak now!');
    // Use browser MediaRecorder to record audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      let audioChunks = [];
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        setRecording(false);
        setTranscribing(true);
        setInstruction('Transcribing...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        try {
          const response = await fetch('https://vigilant-lampx.onrender.com/transcribe-audio/', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          setText(data.transcript || '');
        } catch (err) {
          setText('');
        }
        setTranscribing(false);
        setInstruction('');
      };
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 5000); // Record for 5 seconds
    } catch (err) {
      setRecording(false);
      setInstruction('Microphone access denied');
      setTimeout(() => setInstruction(''), 2000);
    }
  };

  return (
    <Box position="relative" w="100%">
      {(recording || transcribing || instruction) && (
        <Box
          position="absolute"
          top={-8}
          left={0}
          w="100%"
          textAlign="center"
          color="white"
          bg="gray.900"
          py={1}
          borderRadius="md"
          zIndex={2}
          fontSize="sm"
        >
          {instruction}
        </Box>
      )}
      <HStack>
        <Tooltip label={recording ? "Recording..." : "Record"} hasArrow>
          <IconButton
            aria-label="Record"
            icon={<Mic color="#fff" size={20} />}
            onClick={handleMic}
            variant="ghost"
            isLoading={recording}
            _hover={{ bg: 'gray.600', icon: { color: '#fff' } }}
          />
        </Tooltip>
        <Input
          placeholder="Type your message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          bg="gray.800"
          color="white"
          _placeholder={{ color: 'gray.400' }}
        />
        <IconButton
          aria-label="Send"
          icon={<ArrowForwardIcon />}
          onClick={handleSend}
          colorScheme="blue"
        />
      </HStack>
    </Box>
  );
}

export default InputBar;
