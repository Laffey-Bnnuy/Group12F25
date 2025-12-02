import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [isKph, setIsKph] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.toggleWrapper}>
          <Switch value={isKph} onValueChange={setIsKph} />
          <Text style={styles.toggleText}>{isKph ? "kph" : "mph"}</Text>
        </View>
      </View>

      {/* Driver Score */}
      <View style={styles.card}>
        <Text style={styles.cardText}>Driver Score: 86/100</Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
      
        <Text style={styles.mapLabel}>Map View</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Miles: 12.4</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg Speed: 34 {isKph ? "kph" : "mph"}</Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Begin Trip</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>End Trip</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary}>
        <Text style={styles.buttonText}>Trip History</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E1012",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#1E88FF",
    borderRadius: 10,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
  },
  toggleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleText: {
    marginLeft: 5,
    color: "white",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  cardText: {
    color: "white",
    fontSize: 18,
  },
  mapContainer: {
    height: 250,
    backgroundColor: "#2B2B2B",
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  mapStyle: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3, // placeholder look
  },
  mapLabel: {
    color: "#bbb",
    fontSize: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statBox: {
    backgroundColor: "#1A1A1A",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },
  statLabel: {
    color: "white",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1E88FF",
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
