import React, { useState } from 'react';
import axios from 'axios';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
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

function Register() {
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Generate public/private key pair
    const keyPair = nacl.box.keyPair();
    const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
    const privateKey = naclUtil.encodeBase64(keyPair.secretKey);

    // Store the private key in local storage (consider more secure alternatives)
    localStorage.setItem('privateKey', privateKey);

    try {
      // Include publicKey in the registration request
      const response = await axios.post('http://localhost:3001/api/register', { username, password, publicKey });
      console.log(response.data);
      // Handle registration logic (e.g., showing a success message, redirecting to login)
      navigate("/login");
    } catch (error) {
      console.error("Registration error", error.response);
      alert("Something went wrong");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className={classes.container}>
        <Typography variant="h4">Register</Typography>
        <form className={classes.form} onSubmit={handleRegister}>
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
            Register
          </Button>
        </form>
        <Grid container justify="flex-end">
          <Grid item>
            <MuiLink component={Link} to="/login" variant="body2">
              Already have an account? Login
            </MuiLink>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Register;
