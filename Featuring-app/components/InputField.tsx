import {
  KeyboardAvoidingView,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  labelStyle,
  icon,
  secureTextEntry = false,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="mb-3 w-full">
          <Text className={`text-sm font-JakartaSemiBold mb-1 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-neutral-100 border border-neutral-300 focus:border-primary-500 rounded-md ${containerStyle}`}
          >
            {icon && (
              <Image source={icon} className={`w-5 h-5 ml-3 ${iconStyle}`} />
            )}
            <TextInput
              className={`py-2.5 px-3 font-JakartaSemiBold text-base flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
