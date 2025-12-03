// Dashboard.tsx
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const router = useRouter();

  // TEMP: replace with logged-in user
  const userID = 1;

  const backend = "http://10.30.109.154:5000";

  const [isKph, setIsKph] = useState(true);
  const [tripID, setTripID] = useState<number | null>(null);

  // LIVE TRIP METRICS
  const [driverScore, setDriverScore] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [avgSpeedKph, setAvgSpeedKph] = useState<number>(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  // GPS DATA
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // ------------------------------
  // Helpers
  // ------------------------------
  const kmToMiles = (km: number) => km * 0.621371;

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

    // ------------------------------
    // LIVE GPS TRACKING
    // ------------------------------
   // ------------------------------
// LIVE GPS TRACKING
// ------------------------------
const lastLat = useRef<number | null>(null);
const lastLon = useRef<number | null>(null);
const hasSentFirstPointRef = useRef(false);

async function sendSensor(tripID: number, speed: number, lat: number, lon: number) {
  await fetch(`${backend}/sensor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripID, speed, latitude: lat, longitude: lon }),
  });
}

useEffect(() => {
  let subscription: any;

  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }

    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      async (loc) => {
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        const speedKph = (loc.coords.speed ?? 0) * 3.6;

        setLatitude(lat);
        setLongitude(lon);

        // FIRST POINT
        if (!hasSentFirstPointRef.current) {
          hasSentFirstPointRef.current = true;
          lastLat.current = lat;
          lastLon.current = lon;

          if (tripID) {
            await sendSensor(tripID, speedKph, lat, lon);
          }
          return;
        }

        // MOVEMENT THRESHOLD
        const moved = haversineDistance(
          lastLat.current!,
          lastLon.current!,
          lat,
          lon
        );

        if (moved < 0.001) return; // 1 meter threshold

        setDistanceKm((prev) => prev + moved);
        lastLat.current = lat;
        lastLon.current = lon;

        if (tripID) {
          await sendSensor(tripID, speedKph, lat, lon);
        }
      }
    );
  })();

  return () => subscription && subscription.remove();
}, [tripID]);




  // ------------------------------
  // Trip Start
  // ------------------------------
  const beginTrip = async () => {
    setDistanceKm(0);
  setAvgSpeedKph(0);
  setElapsedSec(0);

  hasSentFirstPointRef.current = false;
  lastLat.current = null;
  lastLon.current = null;

    setStartTime(Date.now());

    try {
      const res = await fetch(`${backend}/trip/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userID }),
      });
      const json = await res.json();

      if (res.ok) {
        setTripID(json.tripID);
        Alert.alert("Trip Started", `Trip ID: ${json.tripID}`);
      } else {
        Alert.alert("Error", json.message || "Failed to start trip");
      }
    } catch (err) {
      Alert.alert("Error", "Network error starting trip");
    }
  };

  // ------------------------------
  // Trip End
  // ------------------------------
  const endTrip = async () => {
    if (!tripID) return Alert.alert("No Trip", "Start a trip first.");

    try {
      const res = await fetch(`${backend}/trip/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripID }),
      });

      const json = await res.json();
      if (!res.ok) {
        Alert.alert("Error", json.message || "Failed to end trip");
        return;
      }

      Alert.alert("Trip Ended", "Fetching stats...");
      await fetchDriverScore(tripID);
      await fetchTripStats(tripID);

      setTripID(null);
    } catch (err) {
      Alert.alert("Error", "Network error ending trip");
    }
  };

  // ------------------------------
  // Fetch Score
  // ------------------------------
  const fetchDriverScore = async (tID: number) => {
    try {
      const res = await fetch(`${backend}/driver/score/${tID}`);
      const json = await res.json();
      if (res.ok) setDriverScore(Number(json.score));
    } catch {}
  };

  // ------------------------------
  // Fetch Trip Stats
  // ------------------------------
  const fetchTripStats = async (tID: number) => {
    try {
      const res = await fetch(`${backend}/trips/${userID}`);
      const json = await res.json();

      const latest = json.find((t: any) => t.tripID === tID);
      if (latest) {
        setDistanceKm(Number(latest.distance ?? 0));
        setAvgSpeedKph(Number(latest.avgSpeed ?? 0));
      }
    } catch {}
  };

  // Display helpers
  const displayDistance = () => (isKph ? distanceKm : kmToMiles(distanceKm)).toFixed(2);
  const displayAvgSpeed = () =>
    (isKph ? avgSpeedKph : avgSpeedKph * 0.621371).toFixed(1);

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

      {/* Score */}
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Driver Score: {driverScore !== null ? `${driverScore}/100` : "—"}
        </Text>
      </View>

      {/* GPS */}
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Latitude: {latitude ? latitude.toFixed(6) : "—"}
        </Text>
        <Text style={styles.cardText}>
          Longitude: {longitude ? longitude.toFixed(6) : "—"}
        </Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapLabel}>Map View</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            Distance: {displayDistance()} {isKph ? "km" : "mi"}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            Avg Speed: {displayAvgSpeed()} {isKph ? "kph" : "mph"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={beginTrip}>
        <Text style={styles.buttonText}>Begin Trip</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={endTrip}>
        <Text style={styles.buttonText}>End Trip</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => router.push("/trip-history")}
      >
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
    justifyContent: "center",
    alignItems: "center",
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
