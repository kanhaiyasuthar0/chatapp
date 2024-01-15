import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, TextField, Button, Container, Paper, Grid, Link as MuiLink } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    padding: theme.spacing(3),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    width: '100%',
  },
}));

function Login(props) {
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/login`, { username, password });
      // Store the token for authenticated requests
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      // At this point, the private key should already be in local storage from registration
      console.log('Logged in successfully');
      // Redirect to chat or another appropriate component
      props.setIsAuthenticated(true);
      localStorage.setItem('isLoggedIn', true);
      navigate("/chat");
    } catch (error) {
      console.error("Login error", error.response);
      alert("Something went wrong");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className={classes.container}>
        <Typography variant="h4">Login</Typography>
        <form className={classes.form} onSubmit={handleLogin}>
          <TextField
            type="text"
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
          />
          <TextField
            type="password"
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Login
          </Button>
        </form>
        <Grid container justify="flex-end">
          <Grid item>
            <MuiLink component={Link} to="/register" variant="body2">
              Don't have an account? Register
            </MuiLink>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Login;
