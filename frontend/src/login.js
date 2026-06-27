import { useState } from "react";
import { Container, Paper, TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      console.log("Server Response:", res.data);

      navigate("/dashboard");

    } catch (error) {
      console.error("Login failed:", error);
      alert("Invalid Email or Password");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 10 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box>
            <TextField sx={{ mb: 3 }}
              label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email} helperText={errors.email}
              fullWidth required
            />
            <TextField sx={{ mb: 3 }}
              label="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password} helperText={errors.password}
              fullWidth required
            />
            <Button type="submit" variant="contained">Login</Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default Login;