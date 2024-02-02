import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import SimplePeer from "simple-peer";

import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  AppBar,
  Toolbar,
  Typography,
} from "@material-ui/core";
import VideoCallIcon from "@material-ui/icons/VideoCall";
import { IconButton } from "@material-ui/core";
import PhotoCamera from "@material-ui/icons/PhotoCamera";
const useStyles = makeStyles((theme) => ({
  chatWindow: {
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    maxWidth: "100%",
    minWidth: "100%",
    margin: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    backgroundColor: "#E5DDD5",
    // border: "1px solid red",
  },
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    maxWidth: "75%",
    minWidth: "75%",
    margin: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    backgroundColor: "#E5DDD5",
    position: "relative",
  },
  chatNavbar: {
    position: "absolute",
    display: "flex",
    flexDirection: "row-reverse",
    paddingRight: "10px",
    backgroundColor: "#128C7E",
  },
  messageArea: {
    flexGrow: 1,
    overflowY: "auto",
    padding: theme.spacing(2),
  },
  messageInput: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1),
    backgroundColor: "#F0F0F0",
  },
  inputField: {
    flexGrow: 1,
    marginRight: theme.spacing(1),
  },
  messageBubble: {
    maxWidth: "60%",
    margin: "5px",
    padding: "10px",
    borderRadius: "10px",
  },
  senderBubble: {
    marginLeft: "auto",
    backgroundColor: "#DCF8C6",
    textAlign: "right",
  },
  receiverBubble: {
    marginRight: "auto",
    backgroundColor: "#FFFFFF",
    textAlign: "left",
  },
}));

const ChatWindow = (props) => {
  const classes = useStyles();
  const {
    socket,
    room,
    userId,
    friendId,
    sendMessage,
    message,
    setMessage,
    refetch,
    setChat,
    chat,
    decryptMessage,
    publicKey,
    myPublicKey,
  } = props;
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);
  const [videoStarted, setVideoStarted] = useState(false);

  const fetchChat = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}{/api/chat/${userId}/${friendId}`
      );
      let arr = response.data.map((item) => ({
        message: item.message,
        sender: item.sender,
        image: item?.image,
      }));
      setChat(arr);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    console.log("🚀 ~ handleImageChange ~ file:", file);
    if (file) {
      // Prepare to send this file
      const formData = new FormData();
      formData.append("image", file);

      // Send the image to the server
      axios
        .post(`${process.env.REACT_APP_BASE_URL}/api/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          // Handling successful upload

          // Get the path of the uploaded image
          const imagePath = response.data.filePath;

          // Now sending this imagePath as a message through the socket
          const imageMessage = {
            // It should include the sender, receiver, and the image path or URL
            image: imagePath,
            message: {
              encryptedMessage: "",
              nonce: "",
            },
            sender: userId,
            receiver: friendId,
          };
          //   console.log("🚀 ~ handleImageChange ~ imageMessage:", imageMessage);
          socket.emit("chat message", {
            chatRoom: room,
            encryptedMessage: imageMessage,
          });
          fetchChat();
        })
        .catch((error) => {
          // Handle error
          console.error("Error uploading image:", error);
        });
    }
  };

  const enableStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      console.log("stream", stream);
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // Handle the error
      console.error("Failed to get user media", err);
    }
  };
  const createPeerConnection = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      // Signal the peer who you want to call
      console.log(
        "🚀 ~ peer.on ~ userToSignal, callerID, signal:",
        userToSignal
      );
      console.log("🚀 ~ peer.on ~ signal:", signal);
      console.log("🚀 ~ peer.on ~ callerID:", callerID);
      socket.emit("sending signal", { userToSignal, callerID, signal });
    });

    return peer;
  };

  //  To start call

  const startCall = () => {
    setVideoStarted(true);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Directly create a peer connection for the user you want to call
        const peer = createPeerConnection(friendId, socket.id, stream);
        peersRef.current.push({
          peerID: friendId,
          peer,
        });
        setPeers([peer]);
      });
  };

  // For incoming call
  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  useEffect(() => {
    // setChat([]);
    // fetchChat();
    // stream?.getTracks().forEach((track) => track.stop());
    socket.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({
        peerID: payload.callerID,
        peer,
      });

      setPeers((users) => [...users, peer]);
    });

    socket.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      item.peer.signal(payload.signal);
    });
  }, []);
  useEffect(() => {
    console.log("Setting up socket event listeners");
    socket.on("incoming call", ({ from, signal }) => {
      console.log("Incoming call from:", from);
      console.log("Signal data:", signal);
      // rest of your code...
    });

    return () => {
      console.log("Cleaning up socket event listeners");
      // socket.off("incoming call");
    };
  }, [socket]);
  // useEffect(() => {
  //   socket.on("connect", () => {
  //     console.log(`Connected to server with socket ID: ${socket.id}`);
  //   });

  //   // ...
  // }, [socket]);

  return (
    <div className={classes.chatContainer}>
      {videoStarted ? (
        <video ref={videoRef} autoPlay playsInline />
      ) : (
        <>
          <AppBar className={classes.chatNavbar}>
            <Toolbar>
              <Typography
                onClick={() => startCall()}
                variant="h6"
                component="div"
              >
                <VideoCallIcon />
              </Typography>
            </Toolbar>
          </AppBar>
          <Paper className={classes.chatWindow}>
            <List className={classes.messageArea}>
              {chat?.map((msg, index) => (
                <ListItem
                  key={index}
                  className={`${classes.messageBubble} ${
                    msg.sender === userId
                      ? classes.senderBubble
                      : classes.receiverBubble
                  }`}
                >
                  <ListItemText
                    primary={decryptMessage(
                      msg.message,
                      msg.sender === userId ? publicKey : publicKey
                    )}
                  />
                  {msg.image ? (
                    <img
                      src={`${process.env.REACT_APP_BASE_URL}/${msg.image}`}
                      alt="Uploaded"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  ) : (
                    ""
                  )}
                </ListItem>
              ))}
            </List>
            <form className={classes.messageInput} onSubmit={sendMessage}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="icon-button-file"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="icon-button-file">
                <IconButton color="primary" component="span">
                  <PhotoCamera />
                </IconButton>
              </label>
              <TextField
                label="Type a message"
                variant="outlined"
                size="small"
                className={classes.inputField}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" color="primary" type="submit">
                Send
              </Button>
            </form>
          </Paper>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
