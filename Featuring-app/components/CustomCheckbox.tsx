import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

interface CustomCheckboxProps {
  title: string;
  checked: boolean;
  onPress: () => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  title,
  checked,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <View style={styles.innerCheck} />}
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#3B1070",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#00A38C",
  },
  innerCheck: {
    width: 12,
    height: 12,
    backgroundColor: "#66E7D5",
  },
  title: {
    fontSize: 16,
    color: "#3B1070",
  },
});

export default CustomCheckbox;
