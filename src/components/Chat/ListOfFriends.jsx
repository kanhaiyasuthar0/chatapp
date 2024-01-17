import React, { useState, useEffect } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
} from "@material-ui/core";
import { Chat as ChatIcon, Person as PersonIcon } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing(2),
    // borderRight : "1px solid",
    backgroundColor: "#e5ddd5",
    height: "75vh",
    overflow: "auto",
    borderRadius: "5px", 
  },
  friendsList: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.palette.background.paper,
    overflow: "auto",
    textTransform: "capitalize",
    // border : "1px solid"
  },
  addFriend: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: theme.spacing(2),
  },
  header: {
    backgroundColor: "#128C7E", // WhatsApp green color
    color: "white",
    padding: theme.spacing(1),
    width: "94%",
    textAlign: "center",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    maxWidth: 400,
  },
}));

const ListOfFriends = (props) => {
  const classes = useStyles();
  const [friends, setFriends] = useState([]);
  const userId = localStorage.getItem("userId");
  const [newFriendId, setNewFriendId] = useState("");
  const [refetch, setRefetch] = useState(false);
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/api/users/${userId}/friends`)
      .then((response) => {
        setFriends(response.data);
      })
      .catch((error) => console.error("Error fetching friends:", error));
  }, [refetch]);

  const handleAddFriend = () => {
    axios
      .post(`${process.env.REACT_APP_BASE_URL}/api/users/${userId}/add-friend`, {
        friendId: newFriendId,
      })
      .then(() => {
        // Optionally, re-fetch friends list or update UI
        console.log("Friend added successfully");
        setNewFriendId("")
        setRefetch(!refetch)
      })
      .catch((error) => console.error("Error adding friend:", error));
  };

  return (
    <div className={classes.root}>
      <div className={classes.addFriend}>
        <TextField
          type="text"
          label="Enter friend's mobile no."
          variant="outlined"
          value={newFriendId}
          onChange={(e) => setNewFriendId(e.target.value)}
          fullWidth
          size="small"
        />
        <Button
          variant="contained"
          style={{ fontSize: "10px" }}
          color="primary"
          size="small"
          onClick={handleAddFriend}
        >
          Add Friend
        </Button>
      </div>
      <div className={classes.header}>
        {" "}
        <PersonIcon /> My Friends
      </div>

      <List className={classes.friendsList}>
        {friends.map((friend) => (
          <ListItem
            key={friend._id}
            onClick={() => props.openingNewWIndow(friend._id, friend.publicKey)}
            button
          >
            <ListItemText primary={friend.username} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default ListOfFriends;
