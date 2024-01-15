import React, { useEffect } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@material-ui/core";
import { IconButton } from "@material-ui/core";
import PhotoCamera from "@material-ui/icons/PhotoCamera";
const useStyles = makeStyles((theme) => ({
  chatWindow: {
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    maxWidth: "75%",
    minWidth : "75%",
    margin: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    backgroundColor: "#E5DDD5",
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

  const fetchChat = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/chat/${userId}/${friendId}`
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
        .post("http://localhost:3001/api/upload", formData, {
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
  }, []);

  return (
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
                src={`http://localhost:3001/${msg.image}`}
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
  );
};

export default ChatWindow;
