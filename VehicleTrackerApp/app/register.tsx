import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function Register() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleRegister = async () => {
  if (password !== confirmPass) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  try {
    const response = await fetch("http://10.30.109.154:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        phone,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Error", data.message);
      return;
    }

    Alert.alert("Success", "Account created!");
    router.push("/login");

  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Could not connect to server");
  }
};


  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Register</Text>

      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={{ borderWidth: 1, padding: 10, marginBottom: 10 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 10, marginBottom: 10 }} />
      <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} style={{ borderWidth: 1, padding: 10, marginBottom: 10 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, padding: 10, marginBottom: 10 }} />
      <TextInput placeholder="Confirm Password" secureTextEntry value={confirmPass} onChangeText={setConfirmPass} style={{ borderWidth: 1, padding: 10, marginBottom: 20 }} />

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}
