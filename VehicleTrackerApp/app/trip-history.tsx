// trip-history.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TripHistory() {
  const router = useRouter();
  const userID = 1;
  const backend = "http://10.30.109.154:5000";

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backend}/trips/${userID}`);
        const json = await res.json();
        if (res.ok) {
          setTrips(json);
        } else {
          console.log("Failed to fetch trips:", json);
        }
      } catch (err) {
        console.log("Trips fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.tripID || item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/trip/${item.tripID || item.id}`)}
          >
            <Text style={styles.itemTitle}>Trip on {new Date(item.startTime || item.date).toLocaleString()}</Text>
            <Text style={styles.itemText}>Distance: {item.distance !== null && item.distance !== undefined ? `${Number(item.distance).toFixed(2)} km` : "—"}</Text>
            <Text style={styles.itemText}>Avg Speed: {item.avgSpeed !== null && item.avgSpeed !== undefined ? `${Number(item.avgSpeed).toFixed(1)} kph` : "—"}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No trips found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  item: { padding: 14, backgroundColor: "#f3f3f3", borderRadius: 12, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  itemText: { fontSize: 14 },
  emptyText: { textAlign: "center", marginTop: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
