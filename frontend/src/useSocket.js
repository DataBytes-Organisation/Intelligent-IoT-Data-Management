// src/useSocket.js

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Set up your backend's WebSocket URL
const SOCKET_URL = 'http://localhost:5000'; // Change to your backend server URL

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Create a socket connection when the component mounts
    const socketIo = io(SOCKET_URL);

    // Listen for messages from the server
    socketIo.on("message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Store the socket instance in state
    setSocket(socketIo);

    // Cleanup the socket when the component unmounts
    return () => {
      socketIo.disconnect();
    };
  }, []);

  const sendMessage = (msg) => {
    if (socket) {
      socket.emit("message", msg); // Send message to the server
    }
  };

  return {
    messages,
    sendMessage,
  };
};

export default useSocket;

