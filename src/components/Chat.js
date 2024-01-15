import React, { useState, useEffect, useId } from "react";
import io from "socket.io-client";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import axios from "axios";
import ListOfFriends from "./Chat/ListOfFriends";
import ChatWindow from "./Chat/ChatWindow";

const socket = io.connect(process.env.REACT_APP_BASE_URL);

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [openedWindowForFriend, setOpenedWindowForFriend] = useState(null);
  console.log("🚀 ~ Chat ~ openedWindowForFriend:", openedWindowForFriend);
  const [refetch, setRefetch] = useState(false);
  const [room, setRoom] = useState(false);
  console.log("🚀 ~ Chat ~ recipientPublicKey:", recipientPublicKey);
  const userId = localStorage.getItem("userId");
  const [publicKey, setPublicKey] = useState("");
  const [myPublicKey, setMyPublicKey] = useState("");
  const [senderId, setSenderId] = useState("");
  async function getPublicKey(friendId) {
    const resp = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/api/users/${friendId}/public-key`
    );
    const myresp = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/api/users/${userId}/public-key`
    );
    setPublicKey(resp.data.publicKey);
    setMyPublicKey(myresp.data.publicKey);
  }

  function openingNewWIndow(friendId) {
      getPublicKey(friendId).then(() => {
        console.log("calling fetcher")
        setRefetch(!refetch)
          setOpenedWindowForFriend(friendId);
      const roomId = createRoomId(userId, friendId);
      console.log("🚀 ~ openingNewWIndow ~ roomId:", roomId);
      setRoom(roomId);
    });
  }

  const createRoomId = (userId, friendId) => {
    const ids = [userId, friendId].sort();
    return `room_${ids[0]}_${ids[1]}`;
  };

  const fetchChat = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/chat/${userId}/${openedWindowForFriend}`
      );
      let arr = response.data.map((item) => ({
        message: item.message,
        sender: item.sender,
        image: item?.image,
      }));
      console.log("🚀 ~ fetchChat ~ arr:", arr);
      setChat(arr);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  useEffect(() => {
    room && socket.emit("join chat", room);
    socket.on("chat message", (encryptedMsg) => {
      console.log("🚀 ~ socket.on ~ encryptedMsg:", encryptedMsg, publicKey);
      try {
        
        fetchChat();
        // const decryptedMsg = decryptMessage(encryptedMsg);
        // console.log("🚀 ~ socket.on ~ decryptedMsg:", decryptedMsg)
        // setChat([...chat, {message : encryptedMsg, sender : senderId ?? openedWindowForFriend }]);
        // setRefetch(!refetch)
      } catch (error) {
        console.error("Decryption error", error);
      }
    });
    console.log("111")
  }, [chat]);

  useEffect(() =>{
    console.log("222")
    if(userId && openedWindowForFriend ) {
        fetchChat();
    }
  }, [openedWindowForFriend])

  const sendMessage = async (e) => {
    e.preventDefault();

    // Fetch recipient's public key from the server
    // Assuming you have a function to get the recipient's username or ID
    const recipientUsername = openedWindowForFriend; // Replace with actual recipient's username
    const response = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/api/users/${recipientUsername}/public-key`
    );
    setRecipientPublicKey(response.data.publicKey);
    console.log("🚀 ~ sendMessage ~ response:", response.data.publicKey.length);

    // Encrypt the message
    const encryptedMsg = encryptMessage(response.data.publicKey, message);
    setSenderId(userId);
    const newMessage = {
      sender: userId,
      receiver: recipientUsername,
      message: encryptedMsg,
      image: "",
    };
    // socket.emit('chat message', newMessage);
    socket.emit("chat message", {
      chatRoom: room,
      encryptedMessage: newMessage,
    });
    setRefetch(!refetch);
    setMessage("");
  };

  // Encrypt function
  const encryptMessage = (publicKey, message) => {
    // console.log("🚀 ~ encryptMessage ~ publicKey:", publicKey)
    var encoded;
    try {
      encoded = naclUtil.decodeBase64(publicKey);
      // console.log("🚀 ~ decryptMessage ~ decodedPublicKey:", encoded)
      // console.log("🚀 ~ decryptMessage ~ recipientPublicKey:", publicKey)
      if (encoded.length !== 32) {
        throw new Error("Invalid public key length");
      }
    } catch (error) {
      return `Error in public key: ${error.message}`;
    }

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const privateKey = naclUtil.decodeBase64(
      localStorage.getItem("privateKey")
    );
    // console.log("🚀 ~ encryptMessage ~ privateKey:", privateKey.length)
    const encryptedMessage = nacl.box(
      naclUtil.decodeUTF8(message),
      nonce,
      encoded,
      privateKey
    );

    return {
      nonce: naclUtil.encodeBase64(nonce),
      encryptedMessage: naclUtil.encodeBase64(encryptedMessage),
    };
  };

  // Decrypt function
  // const decryptMessage = (encryptedMsg) => {
  //     const { nonce, encryptedMessage } = encryptedMsg;
  //     const decryptedMessage = nacl.box.open(
  //         naclUtil.decodeBase64(encryptedMessage),
  //         naclUtil.decodeBase64(nonce),
  //         naclUtil.decodeBase64(recipientPublicKey),
  //         naclUtil.decodeBase64(localStorage.getItem('privateKey'))
  //     );
  //     return decryptedMessage ? naclUtil.encodeUTF8(decryptedMessage) : 'Failed to decrypt message';
  // };

  const decryptMessage = (encryptedMsg, pubkey) => {
    // console.log("🚀 ~ decryptMessage ~ encryptedMsg:", encryptedMsg)
    if (
      !encryptedMsg ||
      !encryptedMsg?.nonce ||
      !encryptedMsg?.encryptedMessage
    ) {
      return;
    }

    const { nonce, encryptedMessage } = encryptedMsg;
    // console.log("🚀 ~ decryptMessage ~ pubkey:", pubkey, nonce, encryptedMessage, localStorage.getItem('privateKey'))
    let decodedPublicKey;
    try {
      decodedPublicKey = naclUtil.decodeBase64(pubkey);
      // console.log("🚀 ~ decryptMessage ~ decodedPublicKey:", decodedPublicKey)
      // console.log("🚀 ~ decryptMessage ~ recipientPublicKey:", pubkey)
      if (decodedPublicKey.length !== 32) {
        throw new Error("Invalid public key length");
      }
    } catch (error) {
      return `Error in public key: ${error.message}`;
    }

    try {
      const privateKey = naclUtil.decodeBase64(
        localStorage.getItem("privateKey")
      );

      const decryptedMessage = nacl.box.open(
        naclUtil.decodeBase64(encryptedMessage),
        naclUtil.decodeBase64(nonce),
        naclUtil.decodeBase64(pubkey),
        privateKey
      );
      // console.log("🚀 ~ decryptMessage ~ decryptedMessage:", decryptedMessage)
      return decryptedMessage
        ? naclUtil.encodeUTF8(decryptedMessage)
        : "Failed to decrypt message";
    } catch (error) {
      return `Decryption failed: ${error.message}`;
    }
  };
  console.log("CHAT", chat);

  return (
    <div style={{ padding: "10px" }}>
      {/* <h2>Chat</h2> */}
      <div
        className="chat-box"
        style={{
          display: "flex",
          justifyContent: "left",
          gap: "10px",
          padding: "0px 10px",
        }}
      >
        <ListOfFriends
          openingNewWIndow={openingNewWIndow}
          setOpenedWindowForFriend={setOpenedWindowForFriend}
        />
        {openedWindowForFriend && userId && (
          <ChatWindow
            room={room}
            socket={socket}
            myPublicKey={myPublicKey}
            publicKey={publicKey}
            decryptMessage={decryptMessage}
            chat={chat}
            setChat={setChat}
            sendMessage={sendMessage}
            message={message}
            setMessage={setMessage}
            friendId={openedWindowForFriend}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
}

export default Chat;
