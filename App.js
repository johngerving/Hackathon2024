import * as React from "react";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Button,
} from "react-native";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera/next";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const supabase = createClient(
  "https://utopgdybwhxucnvxkaft.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b3BnZHlid2h4dWNudnhrYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMwMzk3NzUsImV4cCI6MjAyODYxNTc3NX0.hn3WqE4JSl716MYmWjAowGQnrtUP-DhJUs9jinBJ7KI"
);

const Map = () => {
  return (
    <View>
      <Text>Map</Text>
    </View>
  );
};

let test = "test";

const Scan = () => {
  /*
  <Ionicons
        name="qr-code-outline"
        size={150}
        color="gray"
        style={{ marginBottom: 30 }}
      />
      <Text
        style={{
          fontSize: 20,
          marginBottom: 30,
          width: "70%",
          textAlign: "center",
        }}
      >
        Scan a QR code at the location nearest you.
      </Text>
      <TouchableWithoutFeedback>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Scan a Code</Text>
        </View>
      </TouchableWithoutFeedback>
  */
  const [facing, setFacing] = React.useState("back");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission"></Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <CameraView style={{ flex: 1 }} facing={facing}></CameraView>
    </View>
  );
};

export default function App() {
  const [locations, setLocations] = React.useState([]);

  React.useEffect(() => {
    getLocations();
  }, []);

  async function getLocations() {
    const { data } = await supabase.from("locations").select();
    console.log(data);
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Map") {
              iconName = focused ? "map" : "map-outline";
            } else if (route.name === "Scan") {
              iconName = focused ? "qr-code" : "qr-code-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Map" component={Map} />
        <Tab.Screen name="Scan" component={Scan} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "tomato",
    borderRadius: "30%",
    width: "fit-content",
    paddingLeft: 10,
    paddingRight: 10,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    padding: 20,
    color: "white",
  },
});
