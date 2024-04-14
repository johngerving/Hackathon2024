import * as React from "react";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Button,
  Image,
  Dimensions,
} from "react-native";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera/next";
import { Picker } from "@react-native-picker/picker";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const supabase = createClient(
  "https://utopgdybwhxucnvxkaft.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b3BnZHlid2h4dWNudnhrYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMwMzk3NzUsImV4cCI6MjAyODYxNTc3NX0.hn3WqE4JSl716MYmWjAowGQnrtUP-DhJUs9jinBJ7KI"
);

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

const Dot = ({ position, color }) => {
  return (
    <View
      style={{
        position: "absolute",
        top: position[1] + "%",
        left: position[0] + "%",
        zIndex: 999,
        width: 6,
        height: 6,
        backgroundColor: color,
        borderRadius: 3,
      }}
    ></View>
  );
};

function Map({ navigation }) {
  const [floorList, setFloorList] = React.useState([]);
  const [selectedFloor, setSelectedFloor] = React.useState(1);
  const [currentLink, setCurrentLink] = React.useState();
  const [locationList, setLocationList] = React.useState([]);

  React.useEffect(() => {
    async function getLocations(floor_id) {
      const { data, error } = await supabase
        .from("locations")
        .select()
        .eq("floor_id", floor_id);

      if (error) {
        console.log(error);
      } else if (data) {
        return data;
      }
    }

    const unsubscribe = navigation.addListener("focus", () => {
      let floor = floorList.find((element) => element.name == selectedFloor);

      if (floor) {
        setCurrentLink(floor.map);
        getLocations(floor.floor_id).then((data) => {
          let locations = [];
          data.forEach((el) => {
            let occupied = el.num_occupants > 0 ? 1 : 0;
            locations.push([el.location_x, el.location_y, occupied]);
          });
          setLocationList(locations);
        });
      }
    });

    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    async function getFloorMaps() {
      const { data, error } = await supabase.from("floors").select();

      if (error) {
        console.log(error);
      } else if (data) {
        let sorted = data.sort((a, b) => a.floor_id - b.floor_id);
        setFloorList(sorted);
        setSelectedFloor(sorted[0].name);
      }
    }
    getFloorMaps();
  }, []);

  React.useEffect(() => {
    async function getLocations(floor_id) {
      const { data, error } = await supabase
        .from("locations")
        .select()
        .eq("floor_id", floor_id);

      if (error) {
        console.log(error);
      } else if (data) {
        return data;
      }
    }

    let floor = floorList.find((element) => element.name == selectedFloor);

    if (floor) {
      setCurrentLink(floor.map);
      getLocations(floor.floor_id).then((data) => {
        let locations = [];
        data.forEach((el) => {
          let occupied = el.num_occupants > 0 ? 1 : 0;
          locations.push([el.location_x, el.location_y, occupied]);
        });
        setLocationList(locations);
      });
    }
  }, [selectedFloor]);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        height: "100%",
      }}
    >
      <Text style={{ fontSize: 25, margin: 10 }}>Library</Text>
      <Picker
        style={{ marginTop: -50 }}
        selectedValue={selectedFloor}
        onValueChange={(itemValue, itemIndex) => setSelectedFloor(itemValue)}
      >
        {floorList.map(function (floor, index) {
          return (
            <Picker.Item label={floor.name} value={floor.name} key={index} />
          );
        })}
      </Picker>
      <View
        style={{
          position: "relative",
          width: "95%",
          margin: "0 auto",
          alignSelf: "center",
        }}
      >
        <Image
          style={{
            width: "100%",
            height: 250,
            margin: 0,
            padding: 0,
          }}
          source={{ uri: currentLink }}
          resizeMode="contain"
        />

        {locationList.map(function (location, index) {
          return (
            <Dot
              position={location}
              color={location[2] == 0 ? "green" : "red"}
              key={index}
            />
          );
        })}
      </View>
    </View>
  );
}

function Scan({ navigation }) {
  const [facing, setFacing] = React.useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [cameraShown, setCameraShown] = React.useState(false);
  const [locationID, setLocationID] = React.useState(null);
  const [floorName, setFloorName] = React.useState(null);
  const [buildingName, setBuildingName] = React.useState(null);

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

  function handleBarCodeScanned({ type, data }) {
    // Data format: "building_id,floor_id,location_id"
    let data_split = data.split(",");
    console.log(data_split);

    supabase
      .from("locations")
      .select("*")
      .match({
        building_id: data_split[0],
        floor_id: data_split[1],
        location_id: data_split[2],
      })
      .then((response, error) => {
        if (error) {
          console.warn(error);
        } else if (response) {
          setLocationID(response.data[0].location_id);
          setScanned(true);
          setCameraShown(false);
          return response;
        }
      })
      .then((response) => {
        return supabase.from("floors").select("*").match({
          floor_id: response.data[0].floor_id,
        });
      })
      .then((response, error) => {
        if (error) {
          console.warn(error);
        } else if (response) {
          setFloorName(response.data[0].name);
          return response;
        }
      })
      .then((response) => {
        return supabase.from("buildings").select("*").match({
          building_id: response.data[0].building_id,
        });
      })
      .then((response, error) => {
        if (error) {
          console.warn(error);
        } else if (response) {
          setBuildingName(response.data[0].name);
        }
      });
  }

  if (cameraShown) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={{ flex: 1 }}
          facing={facing}
        ></CameraView>
        {scanned && (
          <Button
            title={"Tap to Scan Again"}
            onPress={() => setScanned(false)}
          />
        )}
      </View>
    );
  } else {
    if (locationID) {
      return (
        <Scanned
          locationID={locationID}
          setLocationID={setLocationID}
          setScanned={setScanned}
          floorName={floorName}
          buildingName={buildingName}
        />
      );
    } else {
      return (
        <View style={styles.container}>
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
          <TouchableWithoutFeedback onPress={() => setCameraShown(true)}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Scan a Code</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      );
    }
  }
}

const Scanned = ({
  locationID,
  setLocationID,
  setScanned,
  floorName,
  buildingName,
}) => {
  const [checked, setChecked] = React.useState(false);
  const [navigation, setNavigation] = React.useState(null);

  if (checked) {
    if (navigation == "in") {
      return (
        <CheckedIn
          setChecked={setChecked}
          setNavigation={setNavigation}
          locationID={locationID}
          setLocationID={setLocationID}
          setScanned={setScanned}
        />
      );
    } else if (navigation == "out") {
      return (
        <CheckedOut
          setChecked={setChecked}
          setNavigation={setNavigation}
          locationID={locationID}
          setLocationID={setLocationID}
          setScanned={setScanned}
        />
      );
    }
  } else {
    if (locationID && floorName && buildingName) {
      return (
        <View style={styles.container}>
          <Text
            style={{
              fontSize: 20,
              marginBottom: 30,
              width: "70%",
              textAlign: "center",
            }}
          >
            {buildingName}, {floorName}, Location {locationID}
          </Text>
          <TouchableWithoutFeedback
            onPress={() => {
              setChecked(true);
              setNavigation("in");
            }}
          >
            <View
              style={Object.assign({}, styles.button, {
                marginBottom: 30,
                width: "40%",
                height: "20px",
              })}
            >
              <Text style={styles.buttonText}>Check In</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View
              style={Object.assign({}, styles.button, {
                marginBottom: 30,
                width: "40%",
              })}
            >
              <Text
                style={styles.buttonText}
                onPress={() => {
                  setChecked(true);
                  setNavigation("out");
                }}
              >
                Check Out
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      );
    }
  }
};

const CheckedIn = ({
  setChecked,
  setNavigation,
  locationID,
  setLocationID,
  setScanned,
}) => {
  React.useEffect(() => {
    incrementOccupancy(locationID);
  }, []);

  async function incrementOccupancy(location_id) {
    const { data, error } = await supabase.rpc("increment", {
      x: 1,
      id: location_id,
    });
    if (error) {
      console.warn(error);
    }
  }
  return (
    <View style={{ alignItems: "left", backgroundColor: "#fff" }}>
      <Button
        title="Back"
        style={{ textAlign: "left" }}
        onPress={() => {
          setChecked(false);
          setNavigation(null);
          setLocationID(null);
          setScanned(false);
        }}
      />
      <View style={styles.container}>
        <Ionicons
          name="checkmark-circle-outline"
          size={100}
          style={{ marginBottom: 30 }}
          color="black"
        />
        <Text style={{ fontSize: 20 }}>Check-in successful!</Text>
      </View>
    </View>
  );
};

const CheckedOut = ({
  setChecked,
  setNavigation,
  locationID,
  setLocationID,
  setScanned,
}) => {
  React.useEffect(() => {
    decrementOccupancy(locationID);
  }, []);

  async function decrementOccupancy(location_id) {
    const { data, error } = await supabase.rpc("increment", {
      x: -1,
      id: location_id,
    });
    if (error) {
      console.warn(error);
    }
  }

  return (
    <View style={{ alignItems: "left", backgroundColor: "#fff" }}>
      <Button
        title="Back"
        style={{ textAlign: "left" }}
        onPress={() => {
          setChecked(false);
          setNavigation(null);
          setLocationID(null);
          setScanned(false);
        }}
      />
      <View style={styles.container}>
        <Ionicons
          name="checkmark-circle-outline"
          size={100}
          style={{ marginBottom: 30 }}
          color="black"
        />
        <Text style={{ fontSize: 20 }}>Check-out successful!</Text>
      </View>
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
    width: "100%",
    height: "100%",
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
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: "cover",
    backgroundColor: "red",
    // width: "99%",
    // height: undefined,
    // aspectRatio: 23 / 17,
    // backgroundColor: "#fff",
    // margin: 0,
    // padding: 0,
  },
});
