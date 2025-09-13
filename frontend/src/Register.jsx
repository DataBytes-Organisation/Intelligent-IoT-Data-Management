import { useState } from "react";
import "./Register.css";
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
const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords must match");
      throw new Error("Passwords must match");
    }

    setErrorMessage("");
    console.log("Registering user: ", { firstName, lastName, email });
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
          elevation={3}
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
            Register
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="First name"
              type="text"
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              type="text"
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
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
            <TextField
              fullWidth
              label="Confirm Password"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {errorMessage && (
              <Typography sx={{ color: "red" }} variant="p">
                {errorMessage}
              </Typography>
            )}
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
              Register
            </Button>

            <Typography mt={4} sx={{ color: "white" }} textAlign="center">
              Already have an account?
              <Link
                href="/login"
                sx={{ color: "#DECBA4", marginLeft: "10px" }}
                underline="hover"
              >
                Login Here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
