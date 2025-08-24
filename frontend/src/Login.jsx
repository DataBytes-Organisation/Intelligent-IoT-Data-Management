import { useState } from "react";
import "./Login.css";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  Fade,
} from "@mui/material";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  //When submitting on login screen...
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Email: ", email);
    console.log("Password: ", password);

    //Fetch user details from DB
    const response = await fetch();
  };

  const handleForgottenPasswordOverlay = () => {
    setIsModalOpen(true);
  };

  const handleForgottenPasswordClose = () => {
    setIsModalOpen(false);
  };

  const handleForgottenPasswordSubmit = async (e) => {
    e.preventDefault();
    console.log("Password reset request for:", email);
    setIsModalOpen(false);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#4e5d6d",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          sx={{
            p: 4,
            border: "none",
            background: "#4e5d6d",
            boxShadow: "none",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            align="center"
            sx={{ color: "white" }}
            mb={2}
          >
            Welcome to IOT Data Management
          </Typography>

          {!isResetMode ? (
            <Fade in={!isResetMode}>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  variant="standard"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "white",
                    },
                    "& .MuiInputLabel-root": {
                      color: "white",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "white",
                    },
                    borderBottom: "1px solid #fff",
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "white",
                    },
                    "& .MuiInputLabel-root": {
                      color: "white",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "white",
                    },
                    borderBottom: "1px solid #fff",
                  }}
                  margin="normal"
                  variant="standard"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#DECBA4",
                    color: "#000",

                    marginTop: "20px",
                  }}
                >
                  Login
                </Button>

                <Box mt={2} textAlign="center">
                  <Link
                    onClick={() => setIsResetMode(true)}
                    sx={{ color: "#DECBA4" }}
                    underline="hover"
                  >
                    Forgotten password?
                  </Link>
                </Box>

                <Typography mt={4} sx={{ color: "white" }} textAlign="center">
                  No account?{" "}
                  <Link
                    href="/register"
                    sx={{ color: "#DECBA4" }}
                    underline="hover"
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Fade in={isResetMode}>
              <Box component="form" onSubmit={handleForgottenPasswordSubmit}>
                <Typography
                  variant="h6"
                  fontWeight="medium"
                  mb={2}
                  align="center"
                  sx={{ color: "white" }}
                >
                  Reset Password
                </Typography>

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "white",
                    },
                    borderBottom: "1px solid #fff",
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#DECBA4",
                    color: "#000",

                    marginTop: "20px",
                  }}
                >
                  Send Reset Link
                </Button>

                <Box mt={2} textAlign="center">
                  <Link
                    component="button"
                    onClick={() => setIsResetMode(false)}
                    sx={{ color: "#DECBA4" }}
                  >
                    Back to Login
                  </Link>
                </Box>
              </Box>
            </Fade>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
