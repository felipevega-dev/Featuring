import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

declare interface Usuario {
  id: number;
  username: string;
  correo_electronico: string;
  contrasena: string;
  created_at: string; // Puede ser Date dependiendo de cómo manejes las fechas
}

declare interface Perfil {
  id: number;
  usuario_id: number;
  nombre_completo?: string;
  fecha_nacimiento?: string; // Puede ser Date
  biografia?: string;
  foto_perfil?: string;
  edad?: number;
  sexo?: string;
  mensaje_perfil?: string;
  redes_sociales?: Record<string, any>; // Usa un objeto para JSONB
  ubicacion?: string;
}

declare interface Cancion {
  id: number;
  usuario_id: number;
  titulo: string;
  archivo_url: string;
  fecha_subida: string; // Puede ser Date
}

declare interface Habilidad {
  id: number;
  nombre: string;
}

declare interface Genero {
  id: number;
  nombre: string;
}
