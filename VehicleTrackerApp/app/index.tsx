import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Welcome() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome 👋</Text>

      <Link href="/login" asChild>
        <Button title="Login" />
      </Link>

      <Link href="/register" asChild>
        <Button title="Register" />
      </Link>
    </View>
  );
}
