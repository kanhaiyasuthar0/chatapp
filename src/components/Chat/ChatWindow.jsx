import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import Peer from "simple-peer";

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
import VideoPreview from "../Video/localVideo";
import RemoteVideo from "../Video/remoteVideo";
import WifiCalling3Icon from "@mui/icons-material/WifiCalling3";
import "../../App.css";
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
    alignItems: "center",
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
  const [friendCallId, setFriendCallId] = useState("");

  const [myId, setMyId] = useState("");
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState("");
  const [callAccepted, setCallAccepted] = useState("");
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [copyText, setCopyText] = useState("Copy");
  const [showVideo, setShowVideo] = useState(false);
  const [disconnectCall, setDisconnectCall] = useState(false);

  const localVideo = useRef();
  const callerVideo = useRef();
  const connectionRef = useRef();

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

  useEffect(() => {
    // setChat([]);
    // fetchChat();
    // stream?.getTracks().forEach((track) => track.stop());
    socket.on("user joined", (payload) => {
      console.log("joined");
    });
  }, []);

  // Video cal

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream); // Store the local video stream in state for further use
        if (localVideo.current) localVideo.current.srcObject = currentStream;
        // Show user's camera feed on the page
      });
    console.log("🚀 ~ App ~ useEffect localVideo:37", localVideo);

    // Request the ID from the server
    socket.on("me", (id) => {
      console.log("🚀 ~ socket.on ~ id:", id);
      setMyId(id);
    });

    // Listen for a call being made
    socket.on("callUser", (data) => {
      console.log("🚀 ~ socket.on ~ callmade: getting answer", data);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
      setShowVideo(true);
    });
    socket.emit("registerUser", userId);
  }, []);

  // useEffect(() => {
  //   if (showVideo) {
  //     navigator.mediaDevices
  //       .getUserMedia({ video: true, audio: true })
  //       .then((currentStream) => {
  //         setStream(currentStream); // Store the local video stream in state for further use
  //         if (localVideo.current) localVideo.current.srcObject = currentStream;
  //         // Show user's camera feed on the page
  //       });
  //   }
  // }, [showVideo]);

  const callUser = (id) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream); // Store the local video stream in state for further use
        if (localVideo.current) localVideo.current.srcObject = currentStream;
        // Show user's camera feed on the page
      });
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      // Send signal data to the friend you want to call
      socket.emit("callUser", {
        userToCall: friendId,
        signalData: data,
        from: userId,
        name: userId,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("🚀 ~ peer.on ~ remoteStream109:", remoteStream);
      // Display the remote stream in the remoteVideoRef video element
      callerVideo.current.srcObject = remoteStream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      console.log("🚀 ~ socket.on ~ signal:116", signal);
      peer.signal(signal);
    });

    connectionRef.current = peer;
    socket.on("callEnded", () => {
      endCall();
    });
  };

  console.log("callAccepted", callAccepted);

  const answerCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream); // Store the local video stream in state for further use
        if (localVideo.current) localVideo.current.srcObject = currentStream;
        // Show user's camera feed on the page
      });
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      console.log("🚀 ~ pee129", data, caller);
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (remoteStream) => {
      callerVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;

    socket.on("callEnded", () => {
      endCall();
    });
    setReceivingCall(false);
    setDisconnectCall(true);
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    setCallAccepted(false);
    setCallerSignal(null);
    setReceivingCall(false);
    // discoonect the connection
    // socket.emit("disconnect");
  };

  const endCall = () => {
    setCallAccepted(false);
    setCallerSignal(null);
    setReceivingCall(false);
  };

  return (
    <div className={classes.chatContainer}>
      {/* <div style={{ display: "flex" }}>
        <span width="100%" height="350px">
          <video
            style={{ height: "350px" }}
            ref={localVideo}
            autoPlay
            playsInline
          />
        </span>
        <span width="100%" height="350px">
          <video
            style={{ height: "350px" }}
            ref={callerVideo}
            autoPlay
            playsInline
          />
        </span>
      </div> */}
      {/* {showVideo ? (
        <></>
      ) : ( */}
      {/* //  : remoteVideoRef != null ? (
        //   <div className={classes.chatContainer}>
        //     <video ref={remoteVideoRef} autoPlay playsInline />
        //   </div>
        // ) */}
      <>
        <AppBar className={classes.chatNavbar}>
          {receivingCall ? (
            <span
              style={{
                width: "70px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                background: "#4abf4a",
                borderRadius: "50px",
                padding: "3px",
                cursor: "pointer",
              }}
              className="vibrating-button"
              onClick={answerCall}
            >
              <WifiCalling3Icon style={{ margin: "auto" }}></WifiCalling3Icon>
            </span>
          ) : (
            ""
          )}

          {/* <input onChange={(e) => setFriendCallId(e.target.value)}></input>
            <Button
              color="inherit"
              onClick={() => {
                callUser(friendCallId);
              }}
            >
              Call
            </Button> */}
          <Toolbar>
            {!receivingCall && !disconnectCall ? (
              <span
                style={{
                  cursor: "pointer",
                  width: "70px",
                  height: "50px",
                  display: "flex",
                  alignItems: "center",
                  // background: "#4abf4a",
                  borderRadius: "50px",
                  padding: "3px",
                }}
                onClick={() => {
                  callUser();
                  setShowVideo(true);
                }}
                variant="h6"
                component="div"
              >
                <VideoCallIcon
                  fontSize="large"
                  style={{ margin: "auto" }}
                ></VideoCallIcon>
              </span>
            ) : (
              ""
            )}
          </Toolbar>
        </AppBar>
        <Paper className={classes.chatWindow}>
          {receivingCall || showVideo ? (
            <div
            // style={{ display: "flex" }}
            >
              {/* <span width="100%" height="350px"> */}
              {/* <video
                  style={{ height: "350px" }}
                  ref={localVideo}
                  autoPlay
                  playsInline
                /> */}
              <VideoPreview videoRef={localVideo} />
              {/* </span> */}
              {/* {callAccepted ? ( */}
              {/* <span width="100%" height="350px"> */}
              {/* <video
                  style={{ height: "350px" }}
                  ref={callerVideo}
                  autoPlay
                  playsInline
                /> */}
              <RemoteVideo videoRef={callerVideo} leaveCall={leaveCall} />
              {/* </span> */}
            </div>
          ) : (
            <>
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
            </>
          )}
        </Paper>
      </>
    </div>
  );
};

export default ChatWindow;
