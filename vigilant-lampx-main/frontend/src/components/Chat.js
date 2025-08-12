import React, { useState } from 'react';
import { VStack, Box } from '@chakra-ui/react';
import Message from './Message';
import InputBar from './InputBar';

function Chat() {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hello! How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);
    try {
      const response = await fetch('https://vigilant-lampx.onrender.com/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ question: text })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', text: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box
        minH="500px"
        maxH="700px"
        overflowY="auto"
        bg="rgba(30, 41, 59, 0.6)"
        p={4}
        borderRadius="md"
        boxShadow="0 4px 32px 0 rgba(0,0,0,0.30)"
        backdropFilter="blur(6px)"
        border="1.5px solid rgba(255,255,255,0.18)"
      >
        {messages.map((msg, idx) => (
          <Message key={idx} sender={msg.sender} text={msg.text} />
        ))}
        {loading && <Message sender="assistant" text="..." />}
      </Box>
      <InputBar onSend={handleSend} />
    </VStack>
  );
}

export default Chat;
