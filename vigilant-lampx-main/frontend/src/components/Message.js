import React, { useState } from 'react';
import { Box, Text, HStack, IconButton, Tooltip, Spinner } from '@chakra-ui/react';
import { Volume2, Copy } from 'lucide-react';

function Message({ sender, text }) {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handlePlay = async () => {
    setLoadingAudio(true);
    try {
      const response = await fetch('https://vigilant-lampx.onrender.com/tts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        window.URL.revokeObjectURL(url);
      };
    } catch (err) {
      // Optionally show error to user
    }
    setLoadingAudio(false);
  };

  return (
    <Box display="flex" justifyContent={isUser ? 'flex-end' : 'flex-start'} mb={2}>
      <Box
        bg={isUser ? 'rgba(37, 99, 235, 0.6)' : 'rgba(55, 65, 81, 0.6)'} // translucent
        color={isUser ? 'white' : 'gray.200'}
        px={4}
        py={3}
        borderRadius={isUser ? 'lg lg 0 2xl' : '2xl 0 lg lg'}
        maxW="70%"
        textAlign={isUser ? 'right' : 'left'}
        boxShadow={isUser ? 'md' : 'sm'}
        backdropFilter="blur(6px)"
      >
        <Text fontWeight={isUser ? 'bold' : 'normal'}>{text}</Text>
        {!isUser && (
          <HStack justify="flex-end" mt={2} spacing={2}>
            <Tooltip label={loadingAudio ? "Loading..." : "Play"} hasArrow>
              <span>
                <IconButton
                  aria-label="Play"
                  icon={loadingAudio ? <Spinner size="sm" color="white" /> : <Volume2 color="#fff" size={20} />}
                  variant="ghost"
                  onClick={handlePlay}
                  isDisabled={loadingAudio}
                  _hover={{ bg: 'gray.600', icon: { color: '#fff' } }}
                />
              </span>
            </Tooltip>
            <Tooltip label={copied ? "Copied!" : "Copy"} hasArrow>
              <IconButton
                aria-label="Copy"
                icon={<Copy color="#fff" size={20} />}
                variant="ghost"
                onClick={handleCopy}
                _hover={{ bg: 'gray.600', icon: { color: '#fff' } }}
              />
            </Tooltip>
          </HStack>
        )}
      </Box>
    </Box>
  );
}

export default Message;
