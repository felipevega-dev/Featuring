import { TouchableOpacity, Text } from "react-native";
import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "primary":
      return "bg-primary-600";
    case "secondary":
      return "bg-secondary-500";
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-transparent border-neutral-300 border";
    default:
      return "bg-primary-600";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return "text-primary-500";
    case "secondary":
      return "text-secondary-100";
    case "danger":
      return "text-red-100";
    case "success":
      return "text-green-100";
    default:
      return "text-white";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  ...props
}: ButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={`w-full py-2 flex flex-row justify-center items-center shadow-sm shadow-neutral-400/50 mb-3 rounded-md ${getBgVariantStyle(bgVariant)} ${className}`}
    {...props}
  >
    {IconLeft && <IconLeft />}
    <Text className={`text-base font-bold ${getTextVariantStyle(textVariant)}`}>
      {title}
    </Text>
    {IconRight && <IconRight />}
  </TouchableOpacity>
);

export default CustomButton;
