import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TripDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // dynamic route param

  // Placeholder trip data — replace later with your backend
  const trip = {
    id,
    distance: "12.4 km",
    avgSpeed: "34 kph",
    date: "2025-01-03",
    duration: "18 min",
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Trip Details</Text>
      <Text style={styles.subTitle}>Trip ID: {trip.id}</Text>

      {/* Trip Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardText}> Date: {trip.date}</Text>
        <Text style={styles.cardText}> Duration: {trip.duration}</Text>
        <Text style={styles.cardText}> Distance: {trip.distance}</Text>
        <Text style={styles.cardText}> Avg Speed: {trip.avgSpeed}</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E1012",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "700",
  },
  subTitle: {
    color: "#aaa",
    marginTop: 5,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 12,
    marginTop: 25,
  },
  cardText: {
    color: "white",
    fontSize: 18,
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: "#1E88FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 40,
    alignItems: "center",
  },
  backText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
