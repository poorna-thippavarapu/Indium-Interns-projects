
import { Box, Container, extendTheme, ChakraProvider } from '@chakra-ui/react';
import Chat from './components/Chat';

const theme = extendTheme({ config: { initialColorMode: 'dark', useSystemColorMode: false } });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        w="100%"
        bgImage="url('/background.jpeg')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
      >
        <Container maxW="2xl" py={8} centerContent>
          <Box
            borderRadius="lg"
            p={4}
            w="100%"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.30)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Chat />
          </Box>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
